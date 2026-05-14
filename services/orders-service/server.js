const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
const path = require("path");

const PROTO_PATH = path.join(__dirname, "../../proto/orders.proto");

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
});

const ordersProto = grpc.loadPackageDefinition(packageDefinition).orders;

let orders = [];
let currentId = 1;

function CreateOrder(call, callback) {
    const order = {
        id: currentId++,
        customer_name: call.request.customer_name,
        customer_phone: call.request.customer_phone,
        pickup_address: call.request.pickup_address,
        delivery_address: call.request.delivery_address,
        status: call.request.status || "CREATED",
    };

    orders.push(order);
    callback(null, order);
}

function GetOrder(call, callback) {
    const order = orders.find((item) => item.id === call.request.id);

    if (!order) {
        return callback({
            code: grpc.status.NOT_FOUND,
            message: "Order not found",
        });
    }

    callback(null, order);
}

function ListOrders(call, callback) {
    callback(null, { orders });
}

function UpdateOrderStatus(call, callback) {
    const order = orders.find((item) => item.id === call.request.id);

    if (!order) {
        return callback({
            code: grpc.status.NOT_FOUND,
            message: "Order not found",
        });
    }

    order.status = call.request.status;
    callback(null, order);
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
        server.start();
    }
);