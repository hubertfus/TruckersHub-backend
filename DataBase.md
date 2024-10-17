# Users

## Schema

```js
{
  "_id": ObjectId,
  "name": String,
  "email": String,
  "role": { "type": String, "enum": ["driver", "dispatcher"] },
  "phone": String,
  "license_number": String,
  "vehicle_id": ObjectId,
  "availability": Boolean,
  "created_at": ISODate,
  "updated_at": ISODate
}
```

## Validator

```js
db.createCollection("users", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["name", "email", "role", "created_at", "updated_at"],
      properties: {
        name: {
          bsonType: "string",
          description: "User's name is required and must be a string.",
        },
        email: {
          bsonType: "string",
          pattern: "^.+@.+$",
          description: "User's email must be a valid and unique email.",
        },
        role: {
          bsonType: "string",
          enum: ["driver", "dispatcher"],
          description: "User's role must be either 'driver' or 'dispatcher'.",
        },
        phone: {
          bsonType: "string",
          pattern: "^[0-9]{9}$",
          description: "User's phone number must be 9 digits long.",
        },
        license_number: {
          bsonType: ["string", "null"],
          description:
            "License number is required for drivers and optional for dispatchers.",
        },
        vehicle_id: {
          bsonType: ["objectId", "null"],
          description: "ID of the vehicle assigned to the driver.",
        },
        availability: {
          bsonType: "bool",
          description: "Driver's availability status must be a boolean.",
        },
        created_at: {
          bsonType: "date",
          description: "Timestamp when the user was created.",
        },
        updated_at: {
          bsonType: "date",
          description: "Timestamp of the last update.",
        },
      },
    },
  },
});
```

# Orders

# Schema

```js
{
  "_id": ObjectId,
  "order_number": String,
  "load_details": {
    "type": String,
    "weight": Number,
    "dimensions": {
      "length": Number,
      "width": Number,
      "height": Number
    }
  },
  "pickup_address": {
    "street": String,
    "city": String,
    "zip_code": String,
    "country": String
  },
  "delivery_address": {
    "street": String,
    "city": String,
    "zip_code": String,
    "country": String
  },
  "status": { "type": String, "enum": ["created", "in_progress", "completed", "cancelled"] },
  "assigned_driver": ObjectId,
  "vehicle_id": ObjectId,
  "estimated_delivery_time": ISODate,
  "actual_delivery_time": ISODate,
  "created_at": ISODate,
  "updated_at": ISODate
}
```

## Validator

```js
db.createCollection("orders", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: [
        "order_number",
        "load_details",
        "pickup_address",
        "delivery_address",
        "status",
        "created_at",
        "updated_at",
      ],
      properties: {
        order_number: {
          bsonType: "string",
          description: "Order number is required.",
        },
        load_details: {
          bsonType: "object",
          required: ["type", "weight", "dimensions"],
          properties: {
            type: {
              bsonType: "string",
              description: "Load type must be a string.",
            },
            weight: {
              bsonType: "double",
              description: "Load weight must be a number.",
            },
            dimensions: {
              bsonType: "object",
              required: ["length", "width", "height"],
              properties: {
                length: {
                  bsonType: "double",
                  description: "Length of the load must be a number.",
                },
                width: {
                  bsonType: "double",
                  description: "Width of the load must be a number.",
                },
                height: {
                  bsonType: "double",
                  description: "Height of the load must be a number.",
                },
              },
            },
          },
        },
        pickup_address: {
          bsonType: "object",
          required: ["street", "city", "zip_code", "country"],
          properties: {
            street: {
              bsonType: "string",
              description: "Pickup street must be a string.",
            },
            city: {
              bsonType: "string",
              description: "Pickup city must be a string.",
            },
            zip_code: {
              bsonType: "string",
              description: "Pickup ZIP code must be a string.",
            },
            country: {
              bsonType: "string",
              description: "Pickup country must be a string.",
            },
          },
        },
        delivery_address: {
          bsonType: "object",
          required: ["street", "city", "zip_code", "country"],
          properties: {
            street: {
              bsonType: "string",
              description: "Delivery street must be a string.",
            },
            city: {
              bsonType: "string",
              description: "Delivery city must be a string.",
            },
            zip_code: {
              bsonType: "string",
              description: "Delivery ZIP code must be a string.",
            },
            country: {
              bsonType: "string",
              description: "Delivery country must be a string.",
            },
          },
        },
        status: {
          bsonType: "string",
          enum: ["created", "in_progress", "completed", "cancelled"],
          description:
            "Order status must be one of the following: 'created', 'in_progress', 'completed', 'cancelled'.",
        },
        assigned_driver: {
          bsonType: ["objectId", "null"],
          description: "The driver assigned to this order.",
        },
        vehicle_id: {
          bsonType: ["objectId", "null"],
          description: "ID of the vehicle assigned to this order.",
        },
        estimated_delivery_time: {
          bsonType: ["date", "null"],
          description: "Estimated delivery time must be a valid date.",
        },
        created_at: {
          bsonType: "date",
          description: "Timestamp when the order was created.",
        },
        updated_at: {
          bsonType: "date",
          description: "Timestamp of the last update.",
        },
      },
    },
  },
});
```

# vehicles

## Schema

```js
{
  "_id": ObjectId,
  "license_plate": String,
  "model": String,
  "brand": String,
  "year": Number,
  "capacity": {
    "weight": Number,
    "volume": {
      "length": Number,
      "width": Number,
      "height": Number
    }
  },
  "current_location": {
    "latitude": Number,
    "longitude": Number
  },
  "maintenance_schedule": [
    {
      "service_type": String,
      "date": ISODate,
      "description": String
    }
  ],
  "assigned_driver": ObjectId,
  "last_maintenance": ISODate,
  "next_maintenance": ISODate,
  "created_at": ISODate,
  "updated_at": ISODate
}
```

## Validator

```js
db.createCollection("vehicles", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: [
        "license_plate",
        "model",
        "brand",
        "capacity",
        "created_at",
        "updated_at",
      ],
      properties: {
        license_plate: {
          bsonType: "string",
          description: "License plate is required.",
        },
        model: {
          bsonType: "string",
          description: "Vehicle model must be a string.",
        },
        brand: {
          bsonType: "string",
          description: "Vehicle brand must be a string.",
        },
        year: {
          bsonType: "int",
          description: "Manufacturing year must be an integer.",
        },
        capacity: {
          bsonType: "object",
          required: ["weight", "volume"],
          properties: {
            weight: {
              bsonType: "double",
              description: "Vehicle weight capacity must be a number.",
            },
            volume: {
              bsonType: "object",
              required: ["length", "width", "height"],
              properties: {
                length: {
                  bsonType: "double",
                  description: "Vehicle volume length must be a number.",
                },
                width: {
                  bsonType: "double",
                  description: "Vehicle volume width must be a number.",
                },
                height: {
                  bsonType: "double",
                  description: "Vehicle volume height must be a number.",
                },
              },
            },
          },
        },
        current_location: {
          bsonType: "object",
          required: ["latitude", "longitude"],
          properties: {
            latitude: {
              bsonType: "double",
              description: "Vehicle latitude must be a number.",
            },
            longitude: {
              bsonType: "double",
              description: "Vehicle longitude must be a number.",
            },
          },
        },
        maintenance_schedule: {
          bsonType: "array",
          items: {
            bsonType: "object",
            required: ["service_type", "date"],
            properties: {
              service_type: {
                bsonType: "string",
                description: "Service type must be a string.",
              },
              date: {
                bsonType: "date",
                description: "Service date must be a valid date.",
              },
              description: {
                bsonType: "string",
                description: "Service description must be a string.",
              },
            },
          },
          description: "Array of scheduled maintenance services.",
        },
        created_at: {
          bsonType: "date",
          description: "Timestamp when the vehicle record was created.",
        },
        updated_at: {
          bsonType: "date",
          description: "Timestamp of the last update.",
        },
      },
    },
  },
});
```

# Invoices

## Schema

```js
{
  "_id": ObjectId,
  "order_id": ObjectId,
  "amount": Number,
  "status": { "type": String, "enum": ["unpaid", "paid", "overdue"] },
  "due_date": ISODate,
  "payment_date": ISODate,
  "created_at": ISODate,
  "updated_at": ISODate
}
```

## Validator

```js
db.createCollection("invoices", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: [
        "invoice_number",
        "order_id",
        "amount",
        "status",
        "issue_date",
      ],
      properties: {
        invoice_number: {
          bsonType: "string",
          description: "Invoice number is required.",
        },
        order_id: {
          bsonType: "objectId",
          description: "Related order ID is required.",
        },
        amount: {
          bsonType: "double",
          description: "Invoice amount must be a number.",
        },
        status: {
          bsonType: "string",
          enum: ["unpaid", "paid", "overdue"],
          description:
            "Invoice status must be either 'unpaid', 'paid', or 'overdue'.",
        },
        issue_date: {
          bsonType: "date",
          description: "Invoice issue date is required.",
        },
        due_date: {
          bsonType: "date",
          description: "Invoice due date is required.",
        },
        payment_date: {
          bsonType: ["date", "null"],
          description: "Invoice payment date.",
        },
        created_at: {
          bsonType: "date",
          description: "Timestamp when the invoice was created.",
        },
        updated_at: {
          bsonType: "date",
          description: "Timestamp of the last update.",
        },
      },
    },
  },
});
```
