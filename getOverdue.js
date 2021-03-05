// const Datastore = require('nedb')
// const db = new Datastore('database.db');
// db.loadDatabase();
const mongodb = require("mongodb");
const { MongoClient } = require("mongodb");

const nodemailer = require("nodemailer");

overdueList = async () => {
  require("dotenv").config();
  const uri = `mongodb+srv://manosverigos:admin@cluster0.pbkow.mongodb.net/ecommerce?retryWrites=true&w=majority`;

  const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  try {
    await client.connect();
    const database = client.db("eshop");
    const collection = database.collection("offers");

    const resultOverdue = await collection.find({ overdue: true }).toArray();
    await collection.updateMany(
      { overdue: true },
      { $set: { warning: "done" } }
    );

    let text = "";

    text += "Σύνολο εκπρόθεσμων ενεργειών\n\n";

    for (i = 0; i < resultOverdue.length; i++) {
      text += `Ενέργεια ${i + 1} \n\n`;
      text += `ID: ${resultOverdue[i]._id} \n`;
      text += `Tίτλος: ${resultOverdue[i].title} \n`;
      text += `Προϊόν / Εταιρία: ${resultOverdue[i].product} \n`;
      text += `Απαιτούμενη αλλαγή: ${resultOverdue[i].comment} \n`;
      text += "\n\n";
    }

    const resultWarning = await collection.find({ warning: "true" }).toArray();
    await collection.updateMany(
      { warning: "true" },
      { $set: { warning: "done" } }
    );

    text +=
      "\n\n------------------------------------------------------------------------------------------\n\n";

    if (resultWarning.length > 0) {
      text += "\n\n Σύνολο ειδοποιήσεων για προσεχώς εκπρόθεσμες ενέργειες\n\n";
    }

    for (i = 0; i < resultWarning.length; i++) {
      text += `Ενέργεια ${i + 1} \n\n`;
      text += `ID: ${resultWarning[i]._id} \n`;
      text += `Tίτλος: ${resultWarning[i].title} \n`;
      text += `Προϊόν / Εταιρία: ${resultWarning[i].product} \n`;
      text += `Απαιτούμενη αλλαγή: ${resultWarning[i].comment} \n`;
      text += "\n\n";
    }

    var transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: `info@primepharmacy.gr`,
        pass: `MNBvcxz/.,12345`,
      },
    });

    let mail_list = 'giorgosv@primepharmacy.gr, manosverigos@hotmail.com, t.nodara@outlook.com'

    //let mail_list = "manosverigos@hotmail.com";

    var mailOptions = {
      from: "info@primepharmacy.gr",
      to: mail_list,
      subject: `Εκπρόθεσμες ενέργειες: ${resultOverdue.length} / Ειδοποιήσεις: ${resultWarning.length}`,
      text: text,
    };

    if((resultOverdue + resultWarning) > 0){
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
