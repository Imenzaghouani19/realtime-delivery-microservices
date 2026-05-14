const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
const path = require("path");

const PROTO_PATH = path.join(__dirname, "../../proto/drivers.proto");

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
});

const driversProto = grpc.loadPackageDefinition(packageDefinition).drivers;

let drivers = [];
let currentId = 1;

function CreateDriver(call, callback) {
    const driver = {
        id: currentId++,
        name: call.request.name,
        phone: call.request.phone,
        vehicle_type: call.request.vehicle_type,
        available: call.request.available,
        latitude: call.request.latitude,
        longitude: call.request.longitude,
    };

    drivers.push(driver);
    callback(null, driver);
}

function GetDriver(call, callback) {
    const driver = drivers.find((item) => item.id === call.request.id);

    if (!driver) {
        return callback({
            code: grpc.status.NOT_FOUND,
            message: "Driver not found",
        });
    }

    callback(null, driver);
}

function ListDrivers(call, callback) {
    callback(null, { drivers });
}

function UpdateDriverAvailability(call, callback) {
    const driver = drivers.find((item) => item.id === call.request.id);

    if (!driver) {
        return callback({
            code: grpc.status.NOT_FOUND,
            message: "Driver not found",
        });
    }

    driver.available = call.request.available;
    callback(null, driver);
}

function UpdateDriverLocation(call, callback) {
    const driver = drivers.find((item) => item.id === call.request.id);

    if (!driver) {
        return callback({
            code: grpc.status.NOT_FOUND,
            message: "Driver not found",
        });
    }

    driver.latitude = call.request.latitude;
    driver.longitude = call.request.longitude;

    callback(null, driver);
}

const server = new grpc.Server();

server.addService(driversProto.DriverService.service, {
    CreateDriver,
    GetDriver,
    ListDrivers,
    UpdateDriverAvailability,
    UpdateDriverLocation,
});

server.bindAsync(
    "0.0.0.0:50053",
    grpc.ServerCredentials.createInsecure(),
    () => {
        console.log("Drivers gRPC service running on port 50053");
    }
);