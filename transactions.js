var fs = require('fs');
var csv = require('fast-csv');
const { Pool, Client } = require('pg');

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'revolut',
    password: 'password123',
    port: 5432,
  });

let counter = 0; //keeps track of which row is being parsed
let startRow = 0;
let errorRowsArray = []; //store id of all rows with errors
//Parses a file from the specified path and returns the CsvParserStream.
//objectMode means return is a object (instead of buffer)
//headers:true means the first row of csv contains column headers
let csvStream = csv.parseFile('./csv/transactions.csv', {objectMode: true, headers: true })
    .on('error', error => console.error(error))
    .on('data', row => {
    csvStream.pause();
    if(Number(row.ROW) > counter && counter < 300000) //change the number to the max rows to parse and insert
    {
        console.log(`Parsing row ${row.ROW}`); //must use uppercase to access row values as the headers are uppercase in the csv file
        let currency = row.CURRENCY;
        let amount = row.AMOUNT;
        let state = row.STATE;
        let created_date = row.CREATED_DATE;
        let merchant_category = String(row.MERCHANT_CATEGORY);
        //console.log("merchant_category = " + merchant_category);
        if(merchant_category.length > 100){
            merchant_category = row.MERCHANT_CATEGORY.substring(0, 99);
        } else {
            merchant_category = row.MERCHANT_CATEGORY;
        }
        let merchant_country = String(row.MERCHANT_COUNTRY);
        //console.log("merchant_country = " + merchant_country);
        if(merchant_country.length > 3){
            merchant_country = row.MERCHANT_COUNTRY.substring(0, 2);
        } else {
            merchant_country = row.MERCHANT_COUNTRY;
        }

        let entry_method = row.ENTRY_METHOD;
        let user_id = row.USER_ID;
        let type = row.TYPE;
        let source = row.SOURCE;
        let id = row.ID;

        pool.query("INSERT INTO transactions(currency, amount, state, created_date, merchant_category, merchant_country, entry_method, user_id, type, source, id) \
        VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)", 
        [currency, amount, state, created_date, merchant_category, merchant_country, entry_method, user_id, type, source, id], 
        function(err){
            if(err)
            {
                errorRowsArray.push(row.ROW);
                console.log(err);
            }
        });
        ++counter;
    }

    csvStream.resume();
    })
    .on('end', rowCount => {
        console.log(`Parsed ${rowCount} rows`);
        console.log(`Error rows: ${errorRowsArray}`);
    });