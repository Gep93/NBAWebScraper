const puppeteer = require('puppeteer');

function scrape3PA (player) {
    return new Promise( async (resolve, reject) => {
        let browser;
        try {
            browser = await puppeteer.launch({
                headless: false,
                defaultViewport: null
            });
    
            let page = await browser.newPage();
    
            let url = 'https://stats.nba.com/';
    
            await page.goto(url);

            await page.waitForSelector('#onetrust-accept-btn-handler', { timeout: 60000 });
            await page.click('#onetrust-accept-btn-handler');

            if (!await loadTimeout(page, 20000)) {
                throw new Error('Page load timed out.');
            }
    
            await page.waitForSelector('div.stats-search__top > input', { timeout: 25000 });
            await page.click('a.stats-search__icon > i');
            
            await page.waitForSelector('div.stats-search__top > input');
            await page.type('div.stats-search__top > input', player, { delay: 100 });

            const playerFound = await page.evaluate((player) => {
                const players = document.querySelectorAll('div.stats-search__results a');
    
                let playerFound = false;
                if (!players.length)
                    return playerFound;
    
                for (let p of players) {
                    if (p.innerHTML.toLowerCase()  === player) {
                        playerFound = true;
                        break;
                    }
                }
    
                return playerFound;
            }, player);

            if (!playerFound) 
                throw new Error('Player not found.');
         
            await page.click('div.stats-search__results a');
    
            await page.waitForSelector('select[name=SeasonType]');
            await optionExists('select[name=SeasonType] option', 'Regular Season', page);
            await (await page.$('select[name=SeasonType]'))
                .type('Regular Season');
            

            await page.waitForSelector('select[name=PerMode]');
            await optionExists('select[name=PerMode] option', 'Per 40 Minutes', page);
            await (await page.$('select[name=PerMode]'))
                .type('Per 40 Minutes');
    
            await page.waitForSelector('div.nba-stat-table__overflow table tbody');
            const threePointersAverage = await page.evaluate(() => {
                const statTables = document.querySelectorAll('div.nba-stat-table__overflow table');
                let averagesArray = [];
                
                for (let table of statTables) {
                    let thead = table.querySelectorAll('thead tr th');
                    let indexOf3PA = Array.from(thead).findIndex((el) => el.innerText === '3PA');
                    
                    if (!indexOf3PA) 
                        continue;
                        
                    let tbodyRows = table.querySelectorAll('tbody tr')
                    for (let tr of tbodyRows) {
                        let td = tr.querySelectorAll('td');
                        averagesArray.push({ 
                            season: td[0].innerText,
                            average: td[indexOf3PA].innerText
                        });
                    }

                    break;
                }
                return averagesArray;
            });

            browser.close();
            return resolve(threePointersAverage);
        } catch (e) {
            browser.close();
            reject(e);
        }
    });
}

function loadTimeout(page, time) {
    return new Promise( async (resolve) => {
        setTimeout(() => {
            return resolve(false);
        }, time);
        page.once('load', () => {return resolve(true)});
    });
}

 function optionExists(selector, innerText, page) {
    return new Promise(async (resolve, reject) => {
         try {
            await page.evaluate((selector, innerText) => {
                const options = document.querySelectorAll(selector);
               
                let optionExists = false;
                for (let option of options) {
                    if (option.innerText === innerText)
                        optionExists = true;
                }
                
                if (!optionExists)
                    throw new Error(`Element: ${selector} with innerText property ${innerText} does not exist`);
            }, selector, innerText);  

            return resolve(true);        
         } catch (e) {
             return reject(e);
         }        
    });
 }

 module.exports = scrape3PA;




 