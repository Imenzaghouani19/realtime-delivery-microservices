const express = require("express");
const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
const path = require("path");

const app = express();
app.use(express.json());

// Orders proto
const ORDERS_PROTO_PATH = path.join(__dirname, "../proto/orders.proto");

const ordersPackageDefinition = protoLoader.loadSync(ORDERS_PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
});

const ordersProto = grpc.loadPackageDefinition(ordersPackageDefinition).orders;

const orderClient = new ordersProto.OrderService(
    "localhost:50051",
    grpc.credentials.createInsecure()
);

// Delivery proto
const DELIVERY_PROTO_PATH = path.join(__dirname, "../proto/delivery.proto");

const deliveryPackageDefinition = protoLoader.loadSync(DELIVERY_PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
});

const deliveryProto = grpc.loadPackageDefinition(deliveryPackageDefinition).delivery;

const deliveryClient = new deliveryProto.DeliveryService(
    "localhost:50052",
    grpc.credentials.createInsecure()
);

app.get("/", (req, res) => {
    res.send("API Gateway is running");
});

// Orders routes
app.post("/orders", (req, res) => {
    const orderData = {
        customer_name: req.body.customer_name,
        customer_phone: req.body.customer_phone,
        pickup_address: req.body.pickup_address,
        delivery_address: req.body.delivery_address,
        status: req.body.status || "CREATED",
    };

    orderClient.CreateOrder(orderData, (error, response) => {
        if (error) {
            return res.status(500).json({ message: error.message });
        }

        res.status(201).json(response);
    });
});

app.get("/orders", (req, res) => {
    orderClient.ListOrders({}, (error, response) => {
        if (error) {
            return res.status(500).json({ message: error.message });
        }

        res.json(response.orders);
    });
});

app.get("/orders/:id", (req, res) => {
    orderClient.GetOrder({ id: Number(req.params.id) }, (error, response) => {
        if (error) {
            return res.status(404).json({ message: error.message });
        }

        res.json(response);
    });
});

app.patch("/orders/:id/status", (req, res) => {
    orderClient.UpdateOrderStatus(
        {
            id: Number(req.params.id),
            status: req.body.status,
        },
        (error, response) => {
            if (error) {
                return res.status(404).json({ message: error.message });
            }

            res.json(response);
        }
    );
});

// Delivery routes
app.post("/deliveries", (req, res) => {
    const deliveryData = {
        order_id: Number(req.body.order_id),
        driver_id: Number(req.body.driver_id),
        pickup_address: req.body.pickup_address,
        delivery_address: req.body.delivery_address,
        status: req.body.status || "ASSIGNED",
    };

    deliveryClient.CreateDelivery(deliveryData, (error, response) => {
        if (error) {
            return res.status(500).json({ message: error.message });
        }

        res.status(201).json(response);
    });
});

app.get("/deliveries", (req, res) => {
    deliveryClient.ListDeliveries({}, (error, response) => {
        if (error) {
            return res.status(500).json({ message: error.message });
        }

        res.json(response.deliveries);
    });
});

app.get("/deliveries/:id", (req, res) => {
    deliveryClient.GetDelivery({ id: Number(req.params.id) }, (error, response) => {
        if (error) {
            return res.status(404).json({ message: error.message });
        }

        res.json(response);
    });
});

app.patch("/deliveries/:id/status", (req, res) => {
    deliveryClient.UpdateDeliveryStatus(
        {
            id: Number(req.params.id),
            status: req.body.status,
        },
        (error, response) => {
            if (error) {
                return res.status(404).json({ message: error.message });
            }

            res.json(response);
        }
    );
});

const PORT = 3000;

app.listen(PORT, () => {
    console.log(`API Gateway running on port ${PORT}`);
});