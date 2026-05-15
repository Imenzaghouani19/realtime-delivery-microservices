const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
const path = require("path");
const db = require("./database/db");
const { startOrderCreatedConsumer } = require("./kafka/consumer");

const PROTO_PATH = path.join(__dirname, "../../proto/delivery.proto");

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
});

const deliveryProto = grpc.loadPackageDefinition(packageDefinition).delivery;

function CreateDelivery(call, callback) {
    const {
        order_id,
        driver_id,
        pickup_address,
        delivery_address,
    } = call.request;

    const status = call.request.status || "ASSIGNED";

    const sql = `
        INSERT INTO deliveries (
            order_id,
            driver_id,
            pickup_address,
            delivery_address,
            status
        )
        VALUES (?, ?, ?, ?, ?)
    `;

    db.run(
        sql,
        [order_id, driver_id, pickup_address, delivery_address, status],
        function (error) {
            if (error) {
                return callback({
                    code: grpc.status.INTERNAL,
                    message: error.message,
                });
            }

            callback(null, {
                id: this.lastID,
                order_id,
                driver_id,
                pickup_address,
                delivery_address,
                status,
            });
        }
    );
}

function GetDelivery(call, callback) {
    db.get(
        "SELECT * FROM deliveries WHERE id = ?",
        [call.request.id],
        (error, row) => {
            if (error) {
                return callback({
                    code: grpc.status.INTERNAL,
                    message: error.message,
                });
            }

            if (!row) {
                return callback({
                    code: grpc.status.NOT_FOUND,
                    message: "Delivery not found",
                });
            }

            callback(null, row);
        }
    );
}

function ListDeliveries(call, callback) {
    db.all("SELECT * FROM deliveries", [], (error, rows) => {
        if (error) {
            return callback({
                code: grpc.status.INTERNAL,
                message: error.message,
            });
        }

        callback(null, { deliveries: rows });
    });
}

function UpdateDeliveryStatus(call, callback) {
    db.run(
        "UPDATE deliveries SET status = ? WHERE id = ?",
        [call.request.status, call.request.id],
        function (error) {
            if (error) {
                return callback({
                    code: grpc.status.INTERNAL,
                    message: error.message,
                });
            }

            if (this.changes === 0) {
                return callback({
                    code: grpc.status.NOT_FOUND,
                    message: "Delivery not found",
                });
            }

            db.get(
                "SELECT * FROM deliveries WHERE id = ?",
                [call.request.id],
                (selectError, row) => {
                    if (selectError) {
                        return callback({
                            code: grpc.status.INTERNAL,
                            message: selectError.message,
                        });
                    }

                    callback(null, row);
                }
            );
        }
    );
}

function DeleteDelivery(call, callback) {
    const sql = "DELETE FROM deliveries WHERE id = ?";

    db.run(sql, [call.request.id], function (error) {
        if (error) {
            return callback({
                code: grpc.status.INTERNAL,
                message: error.message,
            });
        }

        if (this.changes === 0) {
            return callback({
                code: grpc.status.NOT_FOUND,
                message: "Delivery not found",
            });
        }

        callback(null, {
            success: true,
            message: "Delivery deleted successfully",
        });
    });
}

const server = new grpc.Server();

server.addService(deliveryProto.DeliveryService.service, {
    CreateDelivery,
    GetDelivery,
    ListDeliveries,
    UpdateDeliveryStatus,
    DeleteDelivery,
});

if (process.env.KAFKA_ENABLED === "true") {
    startOrderCreatedConsumer();
} else {
    console.log("Kafka consumer disabled");
}

server.bindAsync(
    "0.0.0.0:50052",
    grpc.ServerCredentials.createInsecure(),
    () => {
        console.log("Delivery gRPC service running on port 50052");
    }
);