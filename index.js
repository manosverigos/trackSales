require('dotenv').config()
const mongodb = require("mongodb");
const { MongoClient } = require("mongodb");

const { getSales } = require("./getSales.js");
const { dayDiff } = require("./compareDates.js");

let today = new Date();
const dd = String(today.getDate()).padStart(2, "0");
const mm = String(today.getMonth() + 1).padStart(2, "0"); //January is 0!
const yyyy = today.getFullYear();

today = yyyy + "-" + mm + "-" + dd;


checkProducts = async () => {
  const uri = process.env.MONGO_DB_URI;

  const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  try {
    await client.connect();
    const database = client.db("eshop");
    const collection = database.collection("test_offers");

    const resultSales = await collection.find({ type: "sales" }).toArray();
    for (offer of resultSales) {
      const o_id = new mongodb.ObjectID(`${offer._id}`);
      const filter = {
        "_id": o_id
      }
      const off = await collection.findOne(filter)
      const prods = off.products

      let newProds = []

      for (prod of prods){
        if (!(prod.status == 'complete') && (dayDiff(today, offer.startDate) >= 0)) {
          let sales = await getSales(offer.startDate, today, prod.productID);
          prod.current_sales = sales
        

        if (sales >= parseInt(prod.sales_num)) {
          prod.status = 'overdue'
        }

        if (
          parseInt(prod.sales_num) - sales <= 2 &&
          !(sales >= prod.sales_num) &&
          prod.warning != "done"
        ) {
          prod.warning = 'true'
        }

        if (parseInt(prod.sales_num) - sales > 2) {
          prod.warning = 'false'
          prod.status = 'not-overdue'
        }
        }
        newProds.push(prod)
      }
      const updatedOffer = await collection.updateOne(
        filter,
        { $set: { products: newProds } }
      );
    }

    const resultTime = await collection.find({ type: "time" }).toArray();

    for (offer of resultTime) {
      const o_id = new mongodb.ObjectID(`${offer._id}`);
      const filter = {
        "_id": o_id
      }
      const off = await collection.findOne(filter)
      console.log(off)
      const prod = off.products[0]

      if (!(prod.status == 'complete')) {
        if (dayDiff(today, offer.endDate) >= 0) {
          prod.status = 'overdue'
          console.log('ok')
        }
        if (
          dayDiff(today, offer.endDate) >= -2 &&
          dayDiff(today, offer.endDate) < 0 &&
          prod.warning != "done"
        ) {
          prod.warning = 'true'
        }

        if (dayDiff(today, offer.endDate) < -2) {
          prod.status = 'not-overdue'
          prod.warning = 'false'
        }

        let newProds = [prod]
        const overdueOffer = await collection.updateOne(
          filter,
          { $set: { products: newProds } }
        );
      }
    }
    console.log("check");
  } catch (error) {
    console.log(error)
    console.log("oops");
  } finally {
    await client.close();
  }
};

checkProducts();
