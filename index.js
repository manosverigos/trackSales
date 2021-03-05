// const Datastore = require('nedb')
const mongodb = require("mongodb");
const { MongoClient } = require("mongodb");

const { getSales } = require("./getSales.js");
const { dayDiff } = require("./compareDates.js");

let today = new Date();
const dd = String(today.getDate()).padStart(2, "0");
const mm = String(today.getMonth() + 1).padStart(2, "0"); //January is 0!
const yyyy = today.getFullYear();

today = yyyy + "-" + mm + "-" + dd;

// const db = new Datastore('database.db');
// db.loadDatabase();

checkProducts = async () => {
  const uri = `mongodb+srv://manosverigos:admin@cluster0.pbkow.mongodb.net/ecommerce?retryWrites=true&w=majority`;

  const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  try {
    await client.connect();
    const database = client.db("eshop");
    const collection = database.collection("offers");

    const resultSales = await collection.find({ type: "sales" }).toArray();
    for (offer of resultSales) {
      if (!offer.completed && (dayDiff(today, offer.startDate) >= 0)) {
        let sales = await getSales(offer.startDate, today, offer.product);
        console.log(sales);

        const o_id = new mongodb.ObjectID(`${offer._id}`);
        const updatedOffer = await collection.updateOne(
          { _id: o_id },
          { $set: { current_sales: await sales } }
        );

        if (sales >= parseInt(offer.sales_num)) {
          const overdueOffer = await collection.updateOne(
            { _id: o_id },
            { $set: { overdue: true } }
          );
        }
        if (
          parseInt(offer.sales_num) - sales <= 2 &&
          !(sales >= offer.sales_num) &&
          offer.warning != "done"
        ) {
          const warningOffer = await collection.updateOne(
            { _id: o_id },
            { $set: { warning: "true" } }
          );
        }
        if (parseInt(offer.sales_num) - sales > 2) {
          const notOverdueOffer = await collection.updateOne(
            { _id: o_id },
            { $set: { overdue: false, warning: "false" } }
          );
        }
      }
    }

    const resultTime = await collection.find({ type: "time" }).toArray();

    for (offer of resultTime) {
      const o_id = new mongodb.ObjectID(`${offer._id}`);
      if (!offer.completed) {
        if (dayDiff(today, offer.endDate) >= 0) {
          const overdueOffer = await collection.updateOne(
            { _id: o_id },
            { $set: { overdue: true } }
          );
        }
        if (
          dayDiff(today, offer.endDate) >= -2 &&
          dayDiff(today, offer.endDate) < 0 &&
          offer.warning != "done"
        ) {
          const warningOffer = await collection.updateOne(
            { _id: o_id },
            { $set: { warning: "true" } }
          );
        }
        if (dayDiff(today, offer.endDate) < -2) {
          const notOverdueOffer = await collection.updateOne(
            { _id: o_id },
            { $set: { overdue: false, warning: "false" } }
          );
        }
      }
    }
    console.log("check");
  } catch (error) {
    console.log(error)
    console.log("oops");
  } finally {
    await client.close();
  }

  // db.find({type:'sales'},  async (err,docs) => {
  //   for (offer of docs){
  //     if(!offer.completed){
  //       let sales = await getSales(offer.startDate, today, offer.product)
  //       console.log(sales)
  //       db.update({_id:`${offer._id}`}, {$set: {current_sales: await sales}}, (err, docs) => {
  //         console.log('set sales')
  //         if(sales > offer.sales_num) {
  //           db.update({_id:`${offer._id}`}, {$set: {overdue: true}})
  //         }
  //         if(sales < offer.sales_num) {
  //           db.update({_id:`${offer._id}`}, {$set: {overdue: false}})
  //         }
  //       })
  //     }
  //   }
  // })
  // db.find({type:'time'}, (err, docs) => {
  //   for (offer of docs){
  //     if(!offer.completed){
  //       if (isLater(today, offer.endDate)) {
  //         db.update({_id:`${offer._id}`}, {$set: {overdue: true}})
  //       }
  //       if (!isLater(today, offer.endDate)) {
  //         db.update({_id:`${offer._id}`}, {$set: {overdue: false}})
  //       }
  //     }
  //   }
  // })
};

checkProducts();
