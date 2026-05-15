const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
const path = require("path");
const db = require("./database/db");

const PROTO_PATH = path.join(__dirname, "../../proto/orders.proto");

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
});

const ordersProto = grpc.loadPackageDefinition(packageDefinition).orders;

function CreateOrder(call, callback) {
    const {
        customer_name,
        customer_phone,
        pickup_address,
        delivery_address,
    } = call.request;

    const status = call.request.status || "CREATED";

    const sql = `
        INSERT INTO orders (
            customer_name,
            customer_phone,
            pickup_address,
            delivery_address,
            status
        )
        VALUES (?, ?, ?, ?, ?)
    `;

    db.run(
        sql,
        [customer_name, customer_phone, pickup_address, delivery_address, status],
        function (error) {
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
        }
    );
}

function GetOrder(call, callback) {
    const sql = "SELECT * FROM orders WHERE id = ?";

    db.get(sql, [call.request.id], (error, row) => {
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
    const sql = "SELECT * FROM orders";

    db.all(sql, [], (error, rows) => {
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
    const sql = "UPDATE orders SET status = ? WHERE id = ?";

    db.run(sql, [call.request.status, call.request.id], function (error) {
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

        db.get(
            "SELECT * FROM orders WHERE id = ?",
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