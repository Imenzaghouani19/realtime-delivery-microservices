const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
const path = require("path");

const PROTO_PATH = path.join(__dirname, "../../proto/delivery.proto");

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
});

const deliveryProto = grpc.loadPackageDefinition(packageDefinition).delivery;

let deliveries = [];
let currentId = 1;

function CreateDelivery(call, callback) {
    const delivery = {
        id: currentId++,
        order_id: call.request.order_id,
        driver_id: call.request.driver_id,
        pickup_address: call.request.pickup_address,
        delivery_address: call.request.delivery_address,
        status: call.request.status || "ASSIGNED",
    };

    deliveries.push(delivery);
    callback(null, delivery);
}

function GetDelivery(call, callback) {
    const delivery = deliveries.find((item) => item.id === call.request.id);

    if (!delivery) {
        return callback({
            code: grpc.status.NOT_FOUND,
            message: "Delivery not found",
        });
    }

    callback(null, delivery);
}

function ListDeliveries(call, callback) {
    callback(null, { deliveries });
}

function UpdateDeliveryStatus(call, callback) {
    const delivery = deliveries.find((item) => item.id === call.request.id);

    if (!delivery) {
        return callback({
            code: grpc.status.NOT_FOUND,
            message: "Delivery not found",
        });
    }

    delivery.status = call.request.status;
    callback(null, delivery);
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