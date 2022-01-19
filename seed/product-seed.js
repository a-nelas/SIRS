var mongoose = require('mongoose');


var Product = require('../models/product');


//MongoDB SSL Connection.
const db_server_ip = '192.168.0.100'
const db_server_port = '27017'
const db_name = 'SIRSProject'
const db_server_url = `mongodb://${db_server_ip}:${db_server_port}/${db_name}`;

const mongo_client_options = {
    useNewUrlParser: true, 
    useUnifiedTopology: true,
    tls: true,
    tlsAllowInvalidCertificates: true,
    tlsCertificateKeyFile: '/home/osboxes/Documents/Proyecto/MerchantSIRS/keys/mongodb_client.pem'
};

main().catch(err => console.log(err));

async function main() {
  await mongoose.connect(db_server_url, mongo_client_options);
  console.log(`Esta viva!`);
}


var products = [
    new Product({
	imagePath: 'https://media.timeout.com/images/105693433/image.jpg',
	title: 'Tacos de Suadero',
	description: 'Os melhores tacos em toda Lisboa',
	price: '8'
    }),
    new Product({
	imagePath: 'https://cdn.colombia.com/gastronomia/2011/09/29/tacos-al-pastor-3634.jpg',
	title: 'Tacos de Pastor',
	description: 'Os melhores tacos em toda Lisboa',
	price: '7'
    }),
    new Product({
	imagePath: 'https://media-cdn.tripadvisor.com/media/photo-s/0d/42/a6/8c/tacos-campechanos.jpg',
	title: 'Tacos Campechanos',
	description: 'Os melhores tacos em toda Lisboa',
	price: '10'
    })
];

var done=0;
for(var i = 0; i < products.length; i++){
    products[i].save(function(err,result){
	console.log(result)
	console.log(err)
	done++;
	if(done == products.length){
	    exit()
	}
    });
}

function exit(){
    mongoose.disconnect();
}
