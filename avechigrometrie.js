console.log("Debut du script");
let divData = "div";
let divChart = "div";
let previous_val = [0, 0, 0, 0, -100, 0];
const val = [0, 0, 0, 0, -100, 0];
const step_val = [0, 0, 0, 0, -100, 0];
const step = [0, 0, 0, 0, 0, 0];
let lastDate = new Date();
lastDate = lastDate.getTime();
let siteLocation = "Francon (La Barthe)";
let gauge_drawing = false;
let first_drawing = [true, true, true, true, true, true];

function dynamicGauge() {
    gauge_drawing = false;
    for (let i = 1; i <= 6; i++) {
        if (val[i - 1] != previous_val[i - 1]) {
            step_val[i - 1] += step[i - 1];
            gauge_drawing = true;
        }
        if (val[i - 1] > previous_val[i - 1]) {
            if (step_val[i - 1] >= val[i - 1]) {
                step_val[i - 1] = val[i - 1];
                previous_val[i - 1] = val[i - 1];
            }
        } else {
            if (step_val[i - 1] <= val[i - 1]) {
                step_val[i - 1] = val[i - 1];
                previous_val[i - 1] = val[i - 1];
            }
        }
    }

    if (gauge_drawing) {
        displayFirstRecordData();
    }

    for (let i = 1; i <= 6; i++) {
        if (gauge_drawing || first_drawing[i - 1]) {
            console.log("Drawing...");
            if (i === 1) {
                displayThermometer(step_val[i - 1], "thermoChart");
            } else if (i === 2) {
                drawHygrometrie(step_val[i - 1], "humidityMeter");
            } else {
                displayGauge(i, step_val[i - 1], `divChart${i}`);
            }
            first_drawing[i - 1] = false;
        }
    }
}

async function displayData() {
    if (typeof previous_val === 'undefined') {
        previous_val = [0, 0, 0, 0, 0, 0];
    }
    previous_val = previous_val;
    try {
        console.log("p_val :", previous_val);
        for (let i = 1; i <= 6; i++) {
            let param = i;
            divData = `divData${i}`;
            divChart = `divChart${i}`;
            const data = await fetchData(param);
            lastDate = data[0]._time;
            val[i - 1] = data[0]._value;
            if (val[i - 1] != previous_val[i - 1]) {
                gauge_drawing = true;
                step[i - 1] = (val[i - 1] - previous_val[i - 1]) / 20;
                step_val[i - 1] = previous_val[i - 1];
            }
        }
        console.log("val :", val);
    } catch (error) {
        console.error('Une erreur s\'est produite lors de la récupération des données :', error);
    }

    displayFirstRecordData();
}

function Date_display(dateDisp) {
    dateDisp = new Date(dateDisp);
    let year = dateDisp.getFullYear();
    let month = dateDisp.getMonth() + 1;
    let day = dateDisp.getDate();
    let hour = dateDisp.getHours();
    let min = dateDisp.getMinutes();
    let string_to_return = day + "/" + twoChars(month) + "/" + year + " &agrave; " + hour + ":" + twoChars(min);
    return string_to_return;
}

function displayFirstRecordData() {
    for (let i = 1; i <= 6; i++) {
        const divData = `divData${i}`;
        const param_info = `<p><h2>${field_disp(i)}</h2></p>`;
        document.getElementById(divData).innerHTML = param_info;
    }
    const general_info = `<H1 style="font-family: Arial; color: #B45F04;"><p><b>Derni&egrave;re mesure : </b>le ${Date_display(lastDate)}</p>
        <p><b>Station :</b> ${capitalizeFirstLetter(siteLocation)}</p></H1>`;
    document.getElementById('divGeneral').innerHTML = general_info;
}

function field_disp(field_name) {
    if (field_name == "temp_air" || field_name == 1) {
        return "Temp&eacute;rature de l'air";
    } else if (field_name == "hygro_air" || field_name == 2) {
        return "Hygrom&eacute;trie";
    } else if (field_name == "p_baro_mer" || field_name == 3) {
        return "Pression atmosph&eacute;rique";
    } else if (field_name == "solar_flux" || field_name == 4) {
        return "Flux solaire";
    } else if (field_name == "wind_speed" || field_name == 5) {
        return "Vitesse du vent";
    } else if (field_name == "wind_speed_max" || field_name == 6) {
        return "Vitesse du vent (rafales)";
    }
}

function twoChars(number) {
    number = String(number);
    if (number.length < 2) {
        number = "0" + String(number);
    }
    return number;
}

function capitalizeFirstLetter(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function format_num(num) {
    let num_str = num.toString();
    return num_str.replace(".", ",");
}

function convertUTCDateToLocalDate(date) {
    let newDate = new Date(date.getTime() - date.getTimezoneOffset() * 60 * 1000);
    return newDate;
}

async function fetchData(param) {
    const url = `http://145.239.199.14/cgi-bin/barthe/provide_single_json.py?param=${param}`;
    const response = await fetch(url);
    const jsonData = await response.json();
    return jsonData;
}

function displayGauge(param, val_disp, div) {
    let canvas = document.getElementById(div);
    let ctx = canvas.getContext("2d");
    let min_gauge, max_gauge, unit, digits;
    if (param == 1) {
        min_gauge = -20;
        max_gauge = 50;
        unit = "\u00B0C";
        digits = 1;
    } else if (param == 2) {
        min_gauge = 0;
        max_gauge = 100;
        unit = "%HR";
        digits = 1;
    } else if (param == 3) {
        min_gauge = 400;
        max_gauge = 1400;
        unit = "hPa";
        digits = 1;
    } else if (param == 4) {
        min_gauge = 0;
        max_gauge = 1400;
        unit = "W/m2";
        digits = 0;
    } else if (param == 5) {
        min_gauge = 0;
        max_gauge = 150;
        unit = "km/h";
        digits = 1;
    } else {
        min_gauge = 0;
        max_gauge = 150;
        unit = "km/h";
        digits = 1;
    }
    let nb_grad = 6;
    let labels = [];
    let range_disp = max_gauge - min_gauge;
    let non_disp = 0;
    let multiplier;
    if (range_disp >= 100000) {
        multiplier = 10000;
    } else if (range_disp >= 10000) {
        multiplier = 1000;
    } else if (range_disp >= 1000) {
        multiplier = 100;
    } else if (range_disp >= 100) {
        multiplier = 10;
    } else {
        multiplier = 1;
    }
    let nombre = range_disp;
    while (nombre % (5 * multiplier) !== 0) {
        nombre--;
    }
    non_disp = range_disp - nombre;
    nombre = Math.round(non_disp / 2) - 1 + min_gauge;
    while (nombre % (1 * multiplier) !== 0) {
        nombre--;
    }
    let start_grad = nombre;
    if (range_disp - (start_grad + (range_disp - non_disp)) > start_grad + multiplier) {
        start_grad += multiplier;
    }
    for (let i = 0; i < nb_grad; i++) {
        labels[i] = start_grad + i * (range_disp - non_disp) / (nb_grad - 1);
    }
    if (labels[nb_grad - 1] > max_gauge) {
        for (let i = 0; i < nb_grad; i++) {
            labels[i] -= multiplier;
        }
    }
    let centerX = canvas.width / 2;
    let centerY = canvas.height * 0.9;
    let startAngle = Math.PI;
    let endAngle = 0;
    let anticlockwise = false;
    ctx.clearRect(0, 0, 500, 500);
    for (let i = 0; i < nb_grad; i++) {
        let angle = Math.PI + ((labels[i] - min_gauge) / range_disp * Math.PI);
        let x = centerX + 208 * Math.cos(angle);
        let y = centerY + 208 * Math.sin(angle);
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(x, y);
        ctx.strokeStyle = "black";
        ctx.lineWidth = 0.75;
        ctx.stroke();
        ctx.font = "12px Arial";
        ctx.fillStyle = "black";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(labels[i], x + 15 * Math.cos(angle), y + 15 * Math.sin(angle));
    }
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, 202, startAngle, endAngle, anticlockwise);
    ctx.closePath();
    ctx.fillStyle = "white";
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    let endAngleGauge = Math.PI + ((val_disp - min_gauge) / range_disp * Math.PI);
    if (endAngleGauge > 2 * Math.PI) {
        endAngleGauge = 2 * Math.PI;
    } else if (endAngleGauge < Math.PI) {
        endAngleGauge = Math.PI;
    }
    ctx.arc(centerX, centerY, 190, startAngle, endAngleGauge, anticlockwise);
    ctx.closePath();
    ctx.fillStyle = "#DF7401";
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, 165, startAngle, endAngle, anticlockwise);
    ctx.closePath();
    ctx.fillStyle = "white";
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, 202, startAngle, endAngle, anticlockwise);
    ctx.closePath();
    ctx.strokeStyle = "black";
    ctx.lineWidth = 0.75;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, 153, startAngle, endAngle, anticlockwise);
    ctx.closePath();
    ctx.strokeStyle = "black";
    ctx.lineWidth = 0.75;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, 153 - 0.75, startAngle + 2, endAngle - 2, anticlockwise);
    ctx.closePath();
    ctx.fillStyle = "white";
    ctx.fill();
    ctx.font = "60px Arial";
    ctx.fillStyle = "black";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(val_disp.toFixed(digits).replace(".", ","), 250, 180);
    ctx.font = "24px Arial";
    ctx.fillText(unit, 250, 225);
}

function displayThermometer(val, div) {
    let canvas = document.getElementById(div);
    let ctx = canvas.getContext("2d");
    let min_value = -10;
    let max_value = 50;
    let x = 100;
    let y = 50;
    let width = 50;
    let height = 300;
    let height_carre = 50;
    let circleRadius = 37;
    let circleTopOffset = 28;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();
    ctx.rect(x, y, width, height);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 0.75;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x + width / 2, y + height + circleTopOffset, circleRadius, 0, Math.PI * 2, false);
    ctx.fillStyle = '#FF0000';
    ctx.fill();
    ctx.lineWidth = 0.75;
    ctx.strokeStyle = '#000';
    ctx.stroke();
    let ratio = (val - min_value) / (max_value - min_value);
    let fillHeight = ratio * height;
    ctx.beginPath();
    ctx.rect(x, y + height - fillHeight, width, fillHeight);
    ctx.fillStyle = '#FF0000';
    ctx.fill();
    ctx.font = '14px Arial';
    ctx.fillStyle = '#333';
    ctx.textAlign = 'right';
    for (let i = 0; i <= 6; i++) {
        let gradValue = min_value + (i * 10);
        let gradY = y + height - (i * (height / 6));
        ctx.fillText(gradValue, x - 10, gradY + 5);
        ctx.beginPath();
        ctx.moveTo(x - 5, gradY);
        ctx.lineTo(x, gradY);
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 0.75;
        ctx.stroke();
    }
    ctx.font = '20px Arial';
    ctx.fillStyle = '#000';
    ctx.textAlign = 'center';
    ctx.fillText(val.toFixed(1) + " °C", x + width / 2, y - 10);
}


function drawHygrometrie(val, div) {
    let canvas = document.getElementById(div);
    let ctx = canvas.getContext("2d");
    let min_value = 0;
    let max_value = 100;
    let x = 100;
    let y = 50;
    let width = 50;
    let height = 300;
    let height_carre = 100;
    let circleRadius = 37;
    let circleTopOffset = 28;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    //Dibuja el rectángulo del higrómetro
    ctx.beginPath();
    ctx.rect(x, y, width, height);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 0.75;
    ctx.stroke();

    //Dibuja el círculo en la parte inferior
    ctx.beginPath();
    ctx.arc(x + width / 2, y + height + circleTopOffset, circleRadius, 0, Math.PI * 2, false);
    ctx.fillStyle = '#00aaff';
    ctx.fill();
    ctx.lineWidth = 0.75;
    ctx.strokeStyle = '#000';
    ctx.stroke();

    //Calcula la altura de relleno basada en el valor
    let ratio = (val - min_value) / (max_value - min_value);
    let fillHeight = ratio * height;

    //Rellena el rectángulo con el color
    ctx.beginPath();
    ctx.rect(x, y + height - fillHeight, width, fillHeight);
    ctx.fillStyle = '#00aaff';
    ctx.fill();
    ctx.font = '14px Arial';
    ctx.fillStyle = '#000';
    ctx.textAlign = 'right';


    //gota de agua
   
    ctx.beginPath();
    ctx.moveTo(200, 180);
    
    ctx.bezierCurveTo(170, 320, 130, 320, 200, 350);
    ctx.bezierCurveTo(280, 320, 230, 300, 200, 180);

    ctx.closePath();

    //degradado radial
    
    let gradient = ctx.createRadialGradient(170, 330, 5, 170, 330, 40);
    gradient.addColorStop(0, "rgba(173, 216, 230, 1)"); // Azul claro
    gradient.addColorStop(1, "rgba(0, 0, 255, 0.8)"); // Azul intenso
    ctx.fillStyle = gradient;
    ctx.fill();

    //Escala de números

    ctx.font = '14px Arial';
    ctx.fillStyle = '#000';
    ctx.textAlign = 'right';
    for (let i = 0; i <= 10; i++) {
        let gradValue = min_value + (i * 10);
        let gradY = y + height - (i * (height / 10));
        ctx.fillText(gradValue, x - 10, gradY + 5);
        ctx.beginPath();
        ctx.moveTo(x - 5, gradY);
        ctx.lineTo(x, gradY);
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 0.75;
        ctx.stroke();
    }
    ctx.font = '20px Arial';
    ctx.fillStyle = '#000';
    ctx.textAlign = 'center';
    ctx.fillText(val.toFixed(1) + " %", x + width / 2, y - 10);
}


setInterval(displayData, 5000);
setInterval(dynamicGauge, 50);
