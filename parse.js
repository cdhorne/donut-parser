const orders = require("./orders.json");

const metadataKeys = [
    'status',
    'date',
    'time',
    'person',
    'phone',
    'email',
    'multi',
    'price',
    'instructions',
    'paid',
    'from'
]

const ITEMS = {
    MUSUBI: "Musubi",
    ONIGIRI: "Onigiri",
    ASSORTED_HALF_DOZEN : "Assorted - Half Dozen Box",
    ASSORTED_DOZEN : "Assorted - Dozen Box",
    MOCHI_BITES: "Cookies & Cream Mochi Bites"
}

const flavourKeys = [
    'Original Glaze',
    'Swirly Ube',
    //'Ube Coconut',
    //'Brown Sugar Mulk Tea',
    //'Dole Whip',
    //'Chocolate Sprinkle',

    'BOO-Ston Cream',
    'Pumpkin Spice',
    'Candied Apple',
    'Pandan Coconut Alien',

    ITEMS.MOCHI_BITES,
    ITEMS.MUSUBI,
    ITEMS.ONIGIRI,

    'Dairy Free - Original Glaze',
    'Dairy Free - Candied Apple'
    //'DF OG',
    //'DF Pumpkin Spice',
];

// The first 6 items in flavourKeys become the assorted donuts
const assortedFlavours = flavourKeys.slice(0, 6);

// The savory items are grouped together in one box
const SAVORY_ITEMS = [
    ITEMS.MUSUBI,
    ITEMS.ONIGIRI
]

const getFlavoursForBox = (item) => {
    if (item.options.length) {
        return item.options
            .map((option) => option.name)
            .reduce((total, curr) => {
                total[curr] ? total[curr] += 1 : total[curr] = 1;
                return total;
            }, {});
    } else if (item.name === ITEMS.ASSORTED_HALF_DOZEN) {
        return assortedFlavours.reduce((total, current) => ({ ...total, [current]: 1 }), {})
    } else if (item.name === ITEMS.ASSORTED_DOZEN) {
        return assortedFlavours.reduce((total, current) => ({ ...total, [current]: 2 }), {})
    } else {
        return { [item.name]: 1 }
    }
}

const boxJson = orders.orders.flatMap((order) => {
    const fulfillmentDate = new Date(order.fulfill_at);

    const customerMetadata = {
        date: fulfillmentDate.toLocaleDateString(),
        time: fulfillmentDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true }),
        status: order.status,
        person: `${order.client_first_name} ${order.client_last_name}`,
        phone: order.client_phone,
        email: order.client_email,
    }

    const sheetMetadata = {
        paid: "No",
        from: "GloriaFoods",
    }

    const savoryItems = order.items.filter(({ name }) => !SAVORY_ITEMS.includes(name));
    const wholeBoxItems = order.items.filter(({ name }) => !SAVORY_ITEMS.includes(name));

    const orderBoxes = [];

    // Package Musubi/Onigiri Together
    if (savoryItems.length) {
        const savoryBox = Object.fromEntries(SAVORY_ITEMS
            .map((savoryItemName) => [
                savoryItemName,
                order.items
                    .filter(({ name }) => name === savoryItemName)
                    .map(({ quantity }) => quantity)
                    .reduce((total, current) => total + current, 0)
            ]));
        orderBoxes.push(savoryBox);
    }

    wholeBoxItems.forEach((item) => {
        for (let boxNumber = 1; boxNumber <= item.quantity; boxNumber++) {
            orderBoxes.push({
                ...customerMetadata,
                price: item.price,
                instructions: item.instructions,
                ...getFlavoursForBox(item),
            });
        }
    });

    // Add the count to each box
    const boxesWithMetadata = orderBoxes.map((box, index) => ({
        ...customerMetadata,
        multi: orderBoxes.length > 1 ? `${index + 1} / ${orderBoxes.length}` : "",
        ...sheetMetadata,
        ...box,
    }));

    return boxesWithMetadata;
})

const jsonToCsv = (jsonArray) => {
    const replacer = (key, value) => !value ? '' : value;
    const keys = [...metadataKeys,  ...flavourKeys];
    return [
        keys.join(','),
        ...jsonArray.map(row => keys.map(key => JSON.stringify(row[key], replacer)).join(','))
    ].join('\r\n')
}

console.log(jsonToCsv(boxJson));
