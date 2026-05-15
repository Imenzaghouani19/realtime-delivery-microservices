const express = require("express");
const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
const path = require("path");
const { graphqlHTTP } = require("express-graphql");
const { buildSchema } = require("graphql");

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

// Drivers proto
const DRIVERS_PROTO_PATH = path.join(__dirname, "../proto/drivers.proto");

const driversPackageDefinition = protoLoader.loadSync(DRIVERS_PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
});

const driversProto = grpc.loadPackageDefinition(driversPackageDefinition).drivers;

const driverClient = new driversProto.DriverService(
    "localhost:50053",
    grpc.credentials.createInsecure()
);

// Home route
app.get("/", (req, res) => {
    res.send("API Gateway is running");
});

// Orders REST routes
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

app.delete("/orders/:id", (req, res) => {
    orderClient.DeleteOrder({ id: Number(req.params.id) }, (error, response) => {
        if (error) {
            return res.status(404).json({ message: error.message });
        }

        res.json(response);
    });
});

// Delivery REST routes
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

app.delete("/deliveries/:id", (req, res) => {
    deliveryClient.DeleteDelivery(
        { id: Number(req.params.id) },
        (error, response) => {
            if (error) {
                return res.status(404).json({ message: error.message });
            }

            res.json(response);
        }
    );
});

// Drivers REST routes
app.post("/drivers", (req, res) => {
    const driverData = {
        name: req.body.name,
        phone: req.body.phone,
        vehicle_type: req.body.vehicle_type,
        available: req.body.available,
        latitude: Number(req.body.latitude),
        longitude: Number(req.body.longitude),
    };

    driverClient.CreateDriver(driverData, (error, response) => {
        if (error) {
            return res.status(500).json({ message: error.message });
        }

        res.status(201).json(response);
    });
});

app.get("/drivers", (req, res) => {
    driverClient.ListDrivers({}, (error, response) => {
        if (error) {
            return res.status(500).json({ message: error.message });
        }

        res.json(response.drivers);
    });
});

app.get("/drivers/:id", (req, res) => {
    driverClient.GetDriver({ id: Number(req.params.id) }, (error, response) => {
        if (error) {
            return res.status(404).json({ message: error.message });
        }

        res.json(response);
    });
});

app.patch("/drivers/:id/availability", (req, res) => {
    driverClient.UpdateDriverAvailability(
        {
            id: Number(req.params.id),
            available: req.body.available,
        },
        (error, response) => {
            if (error) {
                return res.status(404).json({ message: error.message });
            }

            res.json(response);
        }
    );
});

app.patch("/drivers/:id/location", (req, res) => {
    driverClient.UpdateDriverLocation(
        {
            id: Number(req.params.id),
            latitude: Number(req.body.latitude),
            longitude: Number(req.body.longitude),
        },
        (error, response) => {
            if (error) {
                return res.status(404).json({ message: error.message });
            }

            res.json(response);
        }
    );
});

app.delete("/drivers/:id", (req, res) => {
    driverClient.DeleteDriver({ id: Number(req.params.id) }, (error, response) => {
        if (error) {
            return res.status(404).json({ message: error.message });
        }

        res.json(response);
    });
});

// GraphQL schema
const schema = buildSchema(`
    type Order {
        id: Int
        customer_name: String
        customer_phone: String
        pickup_address: String
        delivery_address: String
        status: String
    }

    type Delivery {
        id: Int
        order_id: Int
        driver_id: Int
        pickup_address: String
        delivery_address: String
        status: String
    }

    type Driver {
        id: Int
        name: String
        phone: String
        vehicle_type: String
        available: Boolean
        latitude: Float
        longitude: Float
    }

    type Query {
        orders: [Order]
        order(id: Int!): Order

        deliveries: [Delivery]
        delivery(id: Int!): Delivery

        drivers: [Driver]
        driver(id: Int!): Driver
    }
`);

// GraphQL resolvers
const root = {
    orders: () => {
        return new Promise((resolve, reject) => {
            orderClient.ListOrders({}, (error, response) => {
                if (error) reject(error);
                else resolve(response.orders);
            });
        });
    },

    order: ({ id }) => {
        return new Promise((resolve, reject) => {
            orderClient.GetOrder({ id }, (error, response) => {
                if (error) reject(error);
                else resolve(response);
            });
        });
    },

    deliveries: () => {
        return new Promise((resolve, reject) => {
            deliveryClient.ListDeliveries({}, (error, response) => {
                if (error) reject(error);
                else resolve(response.deliveries);
            });
        });
    },

    delivery: ({ id }) => {
        return new Promise((resolve, reject) => {
            deliveryClient.GetDelivery({ id }, (error, response) => {
                if (error) reject(error);
                else resolve(response);
            });
        });
    },

    drivers: () => {
        return new Promise((resolve, reject) => {
            driverClient.ListDrivers({}, (error, response) => {
                if (error) reject(error);
                else resolve(response.drivers);
            });
        });
    },

    driver: ({ id }) => {
        return new Promise((resolve, reject) => {
            driverClient.GetDriver({ id }, (error, response) => {
                if (error) reject(error);
                else resolve(response);
            });
        });
    },
};

// GraphQL endpoint
app.use(
    "/graphql",
    graphqlHTTP({
        schema,
        rootValue: root,
        graphiql: true,
    })
);

const PORT = 3000;

app.listen(PORT, () => {
    console.log(`API Gateway running on port ${PORT}`);
});