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
let csvStream = csv.parseFile('./csv/users.csv', {objectMode: true, headers: true })
    .on('error', error => console.error(error))
    .on('data', row => {
    csvStream.pause();		

    if(counter < 10301) //change the number to the max rows to parse and insert
    {
        console.log(`Parsing row ${counter}`); 
        let failed_sign_in_attempts = row.FAILED_SIGN_IN_ATTEMPTS;
        let kyc = row.KYC;
        let birth_year = row.BIRTH_YEAR;
        let country = row.COUNTRY;
        let state = row.STATE;
        let created_date = row.CREATED_DATE;
        let terms_version = row.TERMS_VERSION;
        let phone_country = row.PHONE_COUNTRY;
        let has_email = row.HAS_EMAIL;
        let id = row.ID;

        //check that table name is correct
        pool.query("INSERT INTO users(failed_sign_in_attempts, kyc, birth_year, country, state, created_date, terms_version, phone_country, has_email, id) \
        VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)", 
        [failed_sign_in_attempts, kyc, birth_year, country, state, created_date, terms_version, phone_country, has_email, id], 
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