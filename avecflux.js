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
            } else if (i === 3) {
                drawPressureGauge(step_val[i -1], "pressuremeter");
            }  else if (i === 4) {
                displayFlux_solaire(step_val[i -1], "fluxsolaire")
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
    ctx.moveTo(200, 220);
    
    ctx.bezierCurveTo(170, 320, 130, 320, 200, 350);
    ctx.bezierCurveTo(280, 320, 230, 300, 200, 220);

    ctx.closePath();

    //degradado radial
    
    let gradient = ctx.createRadialGradient(170, 330, 5, 170, 330, 40);
    gradient.addColorStop(0, "rgba(173, 216, 230, 1)"); // Azul claro
    gradient.addColorStop(1, "rgba(0, 0, 255, 0.8)"); // Azul intenso
    ctx.fillStyle = gradient;
    ctx.fill();

    //Añade el símbolo de %
    ctx.font = '48px Arial';
    ctx.fillStyle = 'white';
    ctx.fillText('%', 225, 315);

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

function drawPressureGauge(val, div) {
    const canvas = document.getElementById('pressuremeter');
    const ctx = canvas.getContext('2d');
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = 150;
    const minValue = 400;
    const maxValue = 1400;

    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw the gauge background
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.lineWidth = 20;
    ctx.strokeStyle = '#cccccc';
    ctx.stroke();

    // Draw the gauge face
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius - 10, 0, Math.PI * 2);
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#000000';
    ctx.stroke();

    //Draw scale
    const totalSteps = 11; // 11 steps to include 400, 500, ..., 1400
    const stepSize = (maxValue - minValue) / (totalSteps - 1);
    for (let i = 0; i < totalSteps; i++) {
        const value = minValue + i * stepSize;
        const angle = (value - minValue) / (maxValue - minValue) * 2 * Math.PI - Math.PI * 25 / 18;
        const x = centerX + Math.cos(angle) * (radius - 20);
        const y = centerY + Math.sin(angle) * (radius - 20);

        // Draw tick marks
        ctx.beginPath();
        ctx.moveTo(centerX + Math.cos(angle) * (radius - 30), centerY + Math.sin(angle) * (radius - 30));
        ctx.lineTo(x, y);
        ctx.lineWidth = 1;
        ctx.strokeStyle = '#000000';
        ctx.stroke();

        // Draw scale labels
        if (i > 0) {
            ctx.font = '10px Arial';
            ctx.fillStyle = '#000000';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(value.toFixed(0), centerX + Math.cos(angle) * (radius - 45), centerY + Math.sin(angle) * (radius - 45));
        }
    }

    // Draw the gauge labels
    ctx.font = '18px Arial';
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('hPa', centerX, centerY - radius + 20);
    ctx.font = '12px Arial';
    ctx.fillText('Valeur moyenne', centerX, centerY + 30);
    ctx.fillText('Valeur maximale', centerX - 50, centerY + 60);
    ctx.fillText('Valeur minimale', centerX + 50, centerY + 60);

    // Draw the needle
    const angle = ((val - minValue) / (maxValue - minValue)) * 2 * Math.PI - Math.PI / 2;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(centerX + Math.sin(angle) * (radius - 40), centerY + Math.cos(angle) * (radius - 40));
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#0000';
    ctx.stroke();

    // Draw the value text
    ctx.font = '32px Arial';
    ctx.fillStyle = '#ff0000';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(val.toFixed(2), centerX, centerY - 200);
}

function displayFlux_solaire(val, div) {
    var canvas = document.getElementById(div);
    var ctx = canvas.getContext("2d");
    
    // Paramètres du flux solaire
    var min_value = 0;
    var max_value = 1400;
 
     // Nettoyer le canvas
     ctx.clearRect(0, 0, canvas.width, canvas.height);

    //Position du soleil et épaisseur
     var centerX = canvas.width / 2;
     var centerY = canvas.height / 2;
     var sunRadius = 150;

     // Dibujar el resplandor amarillo
     ctx.beginPath();
     ctx.arc(centerX, centerY, sunRadius, 0, 2 * Math.PI);
     ctx.fillStyle = "#FFD700"; // Amarillo claro
     ctx.fill();
     ctx.closePath();

     // Dibujar el sol naranja
     let innerRadius = (val / 1400) * sunRadius;
     ctx.beginPath();
     ctx.arc(centerX, centerY, innerRadius, 0, 2 * Math.PI);
     ctx.fillStyle = "#FFA500"; // Naranja
     ctx.fill();
     ctx.closePath();

    // Dibujar los rayos del sol
     for (let i = 0; i < 12; i++) {
         let angle = (i * Math.PI) / 6;
         let x1 = centerX + Math.cos(angle) * (sunRadius + 10);
         let y1 = centerY + Math.sin(angle) * (sunRadius + 10);
         let x2 = centerX + Math.cos(angle) * (sunRadius + 80);
         let y2 = centerY + Math.sin(angle) * (sunRadius + 80);

         ctx.beginPath();
         ctx.moveTo(x1, y1);
         ctx.lineTo(x2, y2);
         ctx.strokeStyle = "#DAA520";
         ctx.lineWidth = 5;
         ctx.stroke();
         ctx.closePath();
     }

     // Dibujar la escala vertical
     let scaleHeight = sunRadius; //Altura de la escala
     let step = scaleHeight / 7;//Espaciado entre marcas de la escala
     let maxValue = 1400; // Valor máximo de la escala

        //Dibujar la linea del sol desde el centro hacia arriba
     ctx.beginPath();
     ctx.moveTo(centerX, centerY); //Empieza en el centro del sol
     ctx.lineTo(centerX, centerY - scaleHeight); //Se extiende hacia arriba
     ctx.strokeStyle = "black";
     ctx.lineWidth = 3; //grosor
     ctx.stroke();
     ctx.closePath();

        //Dibujar las marcas de la escala
    for (let i = 0; i <= 7; i++) {
        let y = centerY - i * step; // Ajuste para que las marcas suban
        let lineLength = i === 2 ? 15 : 10; // Línea más larga en el medio
        let value = (maxValue / 7) * i; // Cálculo del valor en cada marca
        
        // Dibujar la linea de la marca
        ctx.beginPath();
        ctx.moveTo(centerX - lineLength / 2, y);
        ctx.lineTo(centerX + lineLength / 2, y);
        ctx.stroke();
        ctx.closePath();

        // Dibujar el número de la escala
        ctx.font = "12px Arial";
        ctx.fillStyle = "black";
        ctx.textAlign = "left"; // Alinea el texto a la izquierda de la escala
        ctx.fillText(value, centerX + 10, y + 4); // Desplaza el texto a la derecha

        // Dibujar el texto del flujo solar
        ctx.fillStyle = "black";
        ctx.font = "16px Arial";
        ctx.fillText(val + " W/m²", centerX - 25, centerY + scaleHeight/4 );
    }
}

setInterval(displayData, 5000);
setInterval(dynamicGauge, 50);
