const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
const path = require("path");
const db = require("./database/db");

const PROTO_PATH = path.join(__dirname, "../../proto/drivers.proto");

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
});

const driversProto = grpc.loadPackageDefinition(packageDefinition).drivers;

function CreateDriver(call, callback) {
    const {
        name,
        phone,
        vehicle_type,
        latitude,
        longitude,
    } = call.request;

    const available = call.request.available ? 1 : 0;

    const sql = `
        INSERT INTO drivers (
            name,
            phone,
            vehicle_type,
            available,
            latitude,
            longitude
        )
        VALUES (?, ?, ?, ?, ?, ?)
    `;

    db.run(
        sql,
        [name, phone, vehicle_type, available, latitude, longitude],
        function (error) {
            if (error) {
                return callback({
                    code: grpc.status.INTERNAL,
                    message: error.message,
                });
            }

            callback(null, {
                id: this.lastID,
                name,
                phone,
                vehicle_type,
                available: Boolean(available),
                latitude,
                longitude,
            });
        }
    );
}

function GetDriver(call, callback) {
    db.get(
        "SELECT * FROM drivers WHERE id = ?",
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
                    message: "Driver not found",
                });
            }

            callback(null, {
                ...row,
                available: Boolean(row.available),
            });
        }
    );
}

function ListDrivers(call, callback) {
    db.all("SELECT * FROM drivers", [], (error, rows) => {
        if (error) {
            return callback({
                code: grpc.status.INTERNAL,
                message: error.message,
            });
        }

        const drivers = rows.map((driver) => ({
            ...driver,
            available: Boolean(driver.available),
        }));

        callback(null, { drivers });
    });
}

function UpdateDriverAvailability(call, callback) {
    const available = call.request.available ? 1 : 0;

    db.run(
        "UPDATE drivers SET available = ? WHERE id = ?",
        [available, call.request.id],
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
                    message: "Driver not found",
                });
            }

            db.get(
                "SELECT * FROM drivers WHERE id = ?",
                [call.request.id],
                (selectError, row) => {
                    if (selectError) {
                        return callback({
                            code: grpc.status.INTERNAL,
                            message: selectError.message,
                        });
                    }

                    callback(null, {
                        ...row,
                        available: Boolean(row.available),
                    });
                }
            );
        }
    );
}

function UpdateDriverLocation(call, callback) {
    db.run(
        "UPDATE drivers SET latitude = ?, longitude = ? WHERE id = ?",
        [call.request.latitude, call.request.longitude, call.request.id],
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
                    message: "Driver not found",
                });
            }

            db.get(
                "SELECT * FROM drivers WHERE id = ?",
                [call.request.id],
                (selectError, row) => {
                    if (selectError) {
                        return callback({
                            code: grpc.status.INTERNAL,
                            message: selectError.message,
                        });
                    }

                    callback(null, {
                        ...row,
                        available: Boolean(row.available),
                    });
                }
            );
        }
    );
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