const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const PROTO_PATH = path.join(__dirname, "../../proto/delivery.proto");
const DB_PATH = path.join(__dirname, "deliveries.db");

const db = new sqlite3.Database(DB_PATH);

db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS deliveries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_id INTEGER NOT NULL,
            driver_id INTEGER NOT NULL,
            pickup_address TEXT NOT NULL,
            delivery_address TEXT NOT NULL,
            status TEXT NOT NULL
        )
    `);
});

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
});

const deliveryProto = grpc.loadPackageDefinition(packageDefinition).delivery;

function CreateDelivery(call, callback) {
    const { order_id, driver_id, pickup_address, delivery_address } = call.request;
    const status = call.request.status || "ASSIGNED";

    const sql = `
        INSERT INTO deliveries
        (order_id, driver_id, pickup_address, delivery_address, status)
        VALUES (?, ?, ?, ?, ?)
    `;

    db.run(sql, [order_id, driver_id, pickup_address, delivery_address, status], function (error) {
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
    });
}

function GetDelivery(call, callback) {
    db.get("SELECT * FROM deliveries WHERE id = ?", [call.request.id], (error, row) => {
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
    });
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
    const { id, status } = call.request;

    db.run("UPDATE deliveries SET status = ? WHERE id = ?", [status, id], function (error) {
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

        db.get("SELECT * FROM deliveries WHERE id = ?", [id], (selectError, row) => {
            if (selectError) {
                return callback({
                    code: grpc.status.INTERNAL,
                    message: selectError.message,
                });
            }

            callback(null, row);
        });
    });
}

const server = new grpc.Server();

server.addService(deliveryProto.DeliveryService.service, {
    CreateDelivery,
    GetDelivery,
    ListDeliveries,
    UpdateDeliveryStatus,
});

server.bindAsync(
    "0.0.0.0:50052",
    grpc.ServerCredentials.createInsecure(),
    () => {
        console.log("Delivery gRPC service running on port 50052");
    }
);