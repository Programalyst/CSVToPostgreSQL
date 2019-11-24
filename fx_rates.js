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
let errorRowsArray = []; //store id of all rows with errors
//Parses a file from the specified path and returns the CsvParserStream.
//objectMode means return is a object (instead of buffer)
//headers:true means the first row of csv contains column headers
let csvStream = csv.parseFile('./csv/fx_rates.csv', {objectMode: true, headers: true })
    .on('error', error => console.error(error))
    .on('data', row => {
    csvStream.pause();		

    if(counter < 999) //change the number to the max rows to parse and insert
    {
        console.log(`Parsing row ${counter}`); 
        let base_ccy = row.base_ccy;
        let ccy = row.ccy;
        let rate = row.rate;

        //check that table name is correct
        pool.query("INSERT INTO fx_rates(base_ccy, ccy, rate) \
        VALUES($1, $2, $3)", 
        [base_ccy, ccy, rate], 
        function(err){
            if(err)
            {
                errorRowsArray.push(counter);
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