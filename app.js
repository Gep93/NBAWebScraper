const puppeteer = require('puppeteer');
const scrape3PA = require('./nba-scraper.js');

const input = process.argv.slice(2);

if(!input.length) {
    console.log('Player name is a required argument.');
    return;
}

let player = input.join(' ').toLowerCase();

scrape3PA(player)
    .then((values) => {
        values.forEach(value => {
            console.log(value.season, value.average);
        });
    })
    .catch((value) => {
        console.log(value);
    });


