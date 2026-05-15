const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const PROTO_PATH = path.join(__dirname, "../../proto/orders.proto");
const DB_PATH = path.join(__dirname, "orders.db");

const db = new sqlite3.Database(DB_PATH);

db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            customer_name TEXT NOT NULL,
            customer_phone TEXT NOT NULL,
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

const ordersProto = grpc.loadPackageDefinition(packageDefinition).orders;

function CreateOrder(call, callback) {
    const { customer_name, customer_phone, pickup_address, delivery_address } = call.request;
    const status = call.request.status || "CREATED";

    const sql = `
        INSERT INTO orders 
        (customer_name, customer_phone, pickup_address, delivery_address, status)
        VALUES (?, ?, ?, ?, ?)
    `;

    db.run(sql, [customer_name, customer_phone, pickup_address, delivery_address, status], function (error) {
        if (error) {
            return callback({
                code: grpc.status.INTERNAL,
                message: error.message,
            });
        }

        callback(null, {
            id: this.lastID,
            customer_name,
            customer_phone,
            pickup_address,
            delivery_address,
            status,
        });
    });
}

function GetOrder(call, callback) {
    db.get("SELECT * FROM orders WHERE id = ?", [call.request.id], (error, row) => {
        if (error) {
            return callback({
                code: grpc.status.INTERNAL,
                message: error.message,
            });
        }

        if (!row) {
            return callback({
                code: grpc.status.NOT_FOUND,
                message: "Order not found",
            });
        }

        callback(null, row);
    });
}

function ListOrders(call, callback) {
    db.all("SELECT * FROM orders", [], (error, rows) => {
        if (error) {
            return callback({
                code: grpc.status.INTERNAL,
                message: error.message,
            });
        }

        callback(null, { orders: rows });
    });
}

function UpdateOrderStatus(call, callback) {
    const { id, status } = call.request;

    db.run("UPDATE orders SET status = ? WHERE id = ?", [status, id], function (error) {
        if (error) {
            return callback({
                code: grpc.status.INTERNAL,
                message: error.message,
            });
        }

        if (this.changes === 0) {
            return callback({
                code: grpc.status.NOT_FOUND,
                message: "Order not found",
            });
        }

        db.get("SELECT * FROM orders WHERE id = ?", [id], (selectError, row) => {
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

server.addService(ordersProto.OrderService.service, {
    CreateOrder,
    GetOrder,
    ListOrders,
    UpdateOrderStatus,
});

server.bindAsync(
    "0.0.0.0:50051",
    grpc.ServerCredentials.createInsecure(),
    () => {
        console.log("Orders gRPC service running on port 50051");
    }
);