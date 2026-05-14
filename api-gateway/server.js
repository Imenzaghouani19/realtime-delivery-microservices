const express = require("express");
const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
const path = require("path");

const app = express();
app.use(express.json());

const PROTO_PATH = path.join(__dirname, "../proto/orders.proto");

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
});

const ordersProto = grpc.loadPackageDefinition(packageDefinition).orders;

const orderClient = new ordersProto.OrderService(
    "localhost:50051",
    grpc.credentials.createInsecure()
);

app.get("/", (req, res) => {
    res.send("API Gateway is running");
});

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
            return res.status(500).json({
                message: error.message,
            });
        }

        res.status(201).json(response);
    });
});

app.get("/orders", (req, res) => {
    orderClient.ListOrders({}, (error, response) => {
        if (error) {
            return res.status(500).json({
                message: error.message,
            });
        }

        res.json(response.orders);
    });
});

app.get("/orders/:id", (req, res) => {
    orderClient.GetOrder({ id: Number(req.params.id) }, (error, response) => {
        if (error) {
            return res.status(404).json({
                message: error.message,
            });
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
                return res.status(404).json({
                    message: error.message,
                });
            }

            res.json(response);
        }
    );
});

const PORT = 3000;

app.listen(PORT, () => {
    console.log(`API Gateway running on port ${PORT}`);
});