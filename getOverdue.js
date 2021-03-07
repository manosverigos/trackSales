require("dotenv").config();
const mongodb = require("mongodb");
const { MongoClient } = require("mongodb");

const nodemailer = require("nodemailer");

overdueList = async () => {

  const uri = process.env.MONGO_DB_URI

  const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  try {
    await client.connect();
    const database = client.db("eshop");
    const collection = database.collection("test_offers");

    const resultOverdue = await collection.aggregate([{$project:{
      products: {
        $filter: {
          input: '$products',
          as: 'product',
          cond: {$eq: ['$$product.status','overdue']}}
        }
      }
    }]).toArray();

    let finalOverdue = resultOverdue.filter(obj => obj.products.length > 0)

    let overdueOffers = []

    for(offer of finalOverdue){
      const o_id = new mongodb.ObjectID(`${offer._id}`);
      const filter = {
        "_id": o_id
      }
      let originalOffer = await collection.findOne(filter)
      originalOffer.products = offer.products
      overdueOffers.push(originalOffer)
    
      for(prod of offer.products){
        console.log(prod)
        await collection.updateOne({"_id": o_id, "products.productID": prod.productID }, { $set: {
          "products.$.warning": "done"
        }}, false, true)
      }
    }

    

    

    const resultWarning = await collection.aggregate([{$project:{
      products: {
        $filter: {
          input: '$products',
          as: 'product',
          cond: {$eq: ['$$product.warning','true']}}
        }
      }
    }]).toArray();

    let finalWarning = resultWarning.filter(obj => obj.products.length > 0)

    let warningOffers = []

    for(offer of finalWarning){
      const o_id = new mongodb.ObjectID(`${offer._id}`);
      const filter = {
        "_id": o_id
      }
      let originalOffer = await collection.findOne(filter)
      originalOffer.products = offer.products
      warningOffers.push(originalOffer)
    
      for(prod of offer.products){
        await collection.updateOne({"_id": o_id, "products.productID": prod.productID }, { $set: {
          "products.$.warning": "done"
        }}, false, true)
      }
    }

    let text = "";
    let subject = ''

    if (overdueOffers.length > 0) {
    text += "Σύνολο εκπρόθεσμων ενεργειών\n\n";
    subject +=`Εκπρόθεσμες ενέργειες: ${overdueOffers.length}` 

    for (i = 0; i < overdueOffers.length; i++) {
      text += `Ενέργεια ${i + 1} \n\n`;
      text += `ID: ${overdueOffers[i]._id} \n`;
      text += `Tίτλος: ${overdueOffers[i].title} \n`;
      for(prod of overdueOffers[i].products){
        if(prod.productID){
          text += `Προϊόν / Εταιρία:${prod.productID} - ${prod.desc} \n`;
        }else{
          text += `Προϊόν / Εταιρία: ${prod.desc} \n`;
        }
      }
      text += `Απαιτούμενη αλλαγή: ${overdueOffers[i].comment} \n`;
      text += "\n\n";
    }
  }

    text +=
      "\n\n------------------------------------------------------------------------------------------\n\n";

    if (warningOffers.length > 0) {
      text += "\n\n Σύνολο ειδοποιήσεων για προσεχώς εκπρόθεσμες ενέργειες\n\n";
      
      subject += `/ Ειδοποιήσεις: ${warningOffers.length}`

    for (i = 0; i < warningOffers.length; i++) {
      text += `Ενέργεια ${i + 1} \n\n`;
      text += `ID: ${warningOffers[i]._id} \n`;
      text += `Tίτλος: ${warningOffers[i].title} \n`;
      for(prod of warningOffers[i].products){
        if(prod.productID){
          text += `Προϊόν / Εταιρία:${prod.productID} - ${prod.desc} \n`;
        }else{
          text += `Προϊόν / Εταιρία: ${prod.desc} \n`;
        }
      }
      text += `Απαιτούμενη αλλαγή: ${warningOffers[i].comment} \n`;
      text += "\n\n";
    }
  }
    var transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    // // let mail_list = 'giorgosv@primepharmacy.gr, manosverigos@hotmail.com, t.nodara@outlook.com'



    let mail_list = "manosverigos@hotmail.com";

    var mailOptions = {
      from: "info@primepharmacy.gr",
      to: mail_list,
      subject: subject,
      text: text,
    };

    if((overdueOffers.length + warningOffers.length) > 0){
      transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error);
      } else {
        console.log("Email sent: " + info.response);
      }
     }
    );
    }
  } catch {
    console.log("oops");
  } finally {
    client.close();
  }
};

overdueList();
