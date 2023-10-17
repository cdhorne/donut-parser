const orders = require("./orders.json");

/** This will fetch the orders directly from the API */
/*
    const orderURL = "https://pos.globalfoodsoft.com/pos/order/pop"
    const authToken = "aYg58tQOqTROygp3J";
    const authFetch = async (url) => {
        const response = await fetch(url, {
            method: "POST",
            headers: { Authorization: authToken }
        });
        return response.json();
    };
    const orders = await authFetch(orderURL);
*/

const metadataKeys = [
    'status',
    'date',
    'time',
    'person',
    'phone',
    'email',
    'multi',
]

const flavourKeys = [
    'Original Glaze',
    'Ube Coconut',
    'Brown Sugar Mulk Tea',
    'Dole Whip',
    'Chocolate Sprinkle',
    'Pumpkin Spice',
    //'Mochi Bites',
    //'Onigiri',
    //'DF OG',
    //'DF Pumpkin Spice',
];

const combinedHeaders = [
    ...metadataKeys,
    ...flavourKeys,
]

const boxJson = orders.orders.flatMap((order) => {
    const fulfillmentDate = new Date(order.fulfill_at);
    const customerMetadata = {
        date: fulfillmentDate.toLocaleDateString(),
        time: fulfillmentDate.toLocaleTimeString(),
        status: order.status,
        person: `${order.client_first_name} ${order.client_last_name}`,
        phone: order.client_phone,
        email: order.client_email,
    }

    return order.items.flatMap((item) => {
        const boxes = [];
        let boxNumber = 1;
        while (boxNumber <= item.quantity) {
            boxes.push({
                ...customerMetadata,
                ...item.options
                    .map((option) => option.name)
                    .reduce((total, curr) => {
                        total[curr] ? total[curr] += 1 : total[curr] = 1;
                        return total;
                    }, {}),
                multi: item.quantity > 1 ? `${boxNumber}/${item.quantity}` : '',
            });
            boxNumber++;
        }
        return boxes;
    });
})

const jsonToCsv = (jsonArray) => {
    const replacer = (key, value) => value === null ? '' : value;
    const keys = [...metadataKeys,  ...flavourKeys];
    return jsonArray
        .map(row => combinedHeaders.map(key => JSON.stringify(row[key], replacer)).join(','))
        .join('\r\n')
}

console.log(jsonToCsv(boxJson));
