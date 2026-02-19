const cheerio = require('cheerio');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

const csvWriter = createCsvWriter({
    path: 'Cekijos_imoniu_kontaktai.csv',
    fieldDelimiter: ';', // <--- PRIDĖK ŠIĄ EILUTĘ
    header: [
        {id: 'name', title: 'IMONE'},
        {id: 'email', title: 'EL_PASTAS'},
        {id: 'url', title: 'NUORODA'}
    ]
});

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function scrapeData() {
    console.log('🚀 Paleidžiame tobuląjį robotą Lietuvos įmonėms...');
    
    const allCompanies = [];
    const totalPages = 15; // NUSTATYTA 78 PUSLAPIAMS (Cekija)

    for (let i = 1; i <= totalPages; i++) {
        console.log(`\n📄 Skaitome puslapį ${i} iš ${totalPages}...`);
        
        try {
            // Lietuvos įmonių URL
            const listUrl = `https://for-driver.info/en/review-company/from/cz?page=${i}`;
            
            const response = await fetch(listUrl, {
                method: 'GET',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.9,lt;q=0.8',
                    'Cache-Control': 'no-cache',
                    'Connection': 'keep-alive',
                    'Upgrade-Insecure-Requests': '1'
                }
            });

            if (!response.ok) {
                console.log(`🛑 Klaida! Statusas: ${response.status} ${response.statusText}`);
                continue;
            }

            const html = await response.text();
            const $ = cheerio.load(html);
            
            // Ištraukiame nuorodas ir PAVADINIMUS tiesiai iš sąrašo!
            const companyItems = [];
            $('.price a').each((index, element) => {
                companyItems.push({
                    url: $(element).attr('href'),
                    name: $(element).text().trim() // Paimame švarų pavadinimą
                });
            });

            console.log(`Rasta ${companyItems.length} įmonių šiame puslapyje.`);

            for (const item of companyItems) {
                try {
                    const detailUrl = item.url.startsWith('http') ? item.url : `https://for-driver.info${item.url}`;
                    
                    const detailResponse = await fetch(detailUrl, {
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                            'Referer': listUrl
                        }
                    });

                    if (!detailResponse.ok) {
                        continue;
                    }

                    const detailHtml = await detailResponse.text();
                    const $$ = cheerio.load(detailHtml);

                    // Ieškome El. pašto PROTINGU būdu (imame href atributą)
                    const emailElement = $$('a[href^="mailto:"]');
                    let email = 'Nera pasto';
                    
                    if (emailElement.length > 0) {
                        // Paimame "mailto:info@imone.lt" ir nukerpame "mailto:"
                        const rawHref = emailElement.attr('href');
                        email = rawHref.replace('mailto:', '').split('?')[0].trim();
                    }

                    allCompanies.push({
                        name: item.name, // Pavadinimą jau turime iš sąrašo!
                        email: email,
                        url: detailUrl
                    });
                    
                    if(email !== 'Nera pasto') {
                         console.log(`✅ Rasta: ${item.name} -> ${email}`);
                    } else {
                         console.log(`⚠️ Nėra pašto: ${item.name}`);
                    }
                   
                } catch (error) {
                    console.log(`❌ Klaida atidarant įmonę: ${item.name}`);
                }

                await delay(1000); // 1 sek pauzė, kad svetainė neatjungtų
            }
        } catch (error) {
            console.log(`❌ Sisteminė klaida: ${error.message}`);
        }
    }

    await csvWriter.writeRecords(allCompanies);
    console.log('\n🎉 VISKAS BAIGTA! Ieškok failo "lietuvos_imoniu_kontaktai.csv" kairėje.');
}

scrapeData();