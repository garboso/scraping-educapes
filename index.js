const axios = require('axios');
const https = require('https');
const fs = require('fs');
const cheerio = require('cheerio');

(async () => {
	for (let year = 2017; year <= 2017; year++) {
		const numberOfResults = await getNumberOfResultsByYear(year);
		const results = await getAllFormattedResults(year, numberOfResults);
		fs.promises.writeFile(`results_${year}.json`, JSON.stringify(results));
	}
})();


async function getNumberOfResultsByYear(year) {
	const currentYearUri =
		`http://www.educapes.capes.gov.br/simple-search?location=%2F&query=&sort_by=dc.date.available_dt&order=desc&filter_field_1=dateIssued&filter_type_1=equals&filter_value_1=${year}`;

	const currentYearFirstPageResults = await axios(currentYearUri, { httpsAgent: new https.Agent({ rejectUnauthorized: false })});
	const $ = cheerio.load(currentYearFirstPageResults.data);

	const resultsCount = $('.paginacao .paginacao').text().split('.')[0].split(' ').slice(-1)[0];

	return resultsCount;
}


async function getAllFormattedResults(year, numberOfResults) {
	const allFormattedResults = [];
	const step = 500;

	for (let start = 0; start <= numberOfResults; start += step) {
		const uri =
			`http://www.educapes.capes.gov.br/simple-search?location=%2F&query=&sort_by=dc.date.available_dt&order=desc&filter_field_1=dateIssued&filter_type_1=equals&filter_value_1=${year}&rpp=${step}&start=${start}`;

		const results = await axios(uri, { httpsAgent: new https.Agent({ rejectUnauthorized: false })});
		const $ = cheerio.load(results.data);

		const resultsList = $('.itemList li');

		const values = resultsList.toArray().map(li => {
			const publicationDate = formatDate($(li).find('.data').text());

			if (publicationDate.getYear() === new Date(year).getYear()) {
				const oda = {
					title: $(li).find('.t1 a').text(),
					link: $(li).find('.t1 a').attr('href'),
					description: $(li).find('.t2').text(),
					publicationDate: publicationDate,
					type: getType($(li).find('.item-list').attr('class').split(' ')[1])
				};

				return oda;
			} else {
				return;
			}
		});

		allFormattedResults.push(...values);
	}

	return allFormattedResults;
}

function formatDate(dateText) {
	const dateSplitted = dateText.split('-');

	if (dateSplitted.length === 1) {
		return new Date(`${dateSplitted[0]}-01-01T00:00:00`);
	} else if (dateSplitted.length === 2) {
		return new Date(`${dateSplitted[1]}-${getMonthNumber(dateSplitted[0])}-01T00:00:00`);
	} else if (dateSplitted.length === 3) {
		return new Date(`${dateSplitted[2]}-${getMonthNumber(dateSplitted[1])}-${dateSplitted[0]}`)
	} else {
		return undefined;
	}
}

function getMonthNumber(portugueseMonthNameAbrev) {
	switch (portugueseMonthNameAbrev) {
		case 'Jan':
			return "01";
			break;
		case 'Fev':
			return "02";
			break;
		case 'Mar':
			return "03";
			break;
		case 'Abr':
			return "04";
			break;
		case 'Mai':
			return "05";
			break;
		case 'Jun':
			return "06";
			break;
		case 'Jul':
			return "07";
			break;
		case 'Ago':
			return "08";
			break;
		case 'Set':
			return "09";
			break;
		case 'Out':
			return "10";
			break;
		case 'Nov':
			return "11";
			break;
		case 'Dez':
			return "12";
			break;
	}
}

function getType(typeClass) {
	switch (typeClass) {
		case 'conteudo-virtual-course':
			return 'aula digital';
			break;
		case 'conteudo-imagem':
			return 'imagem';
			break;
		case 'conteudo-texto':
			return 'livro digital';
			break;
		case 'conteudo-portal':
			return 'web';
			break;
		case 'conteudo-audio':
			return 'áudio';
			break;
		case 'conteudo-generico':
			return 'outro';
			break;
		case 'conteudo-video':
			return 'vídeo';
			break;
		case 'conteudo-tool':
			return 'ferramenta';
			break;
		default:
			return 'não definido';
	}
}




