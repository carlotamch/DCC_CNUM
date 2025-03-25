console.log("Debut du script");

async function updateLastUpdate() {
    try {
        const dataheureactuelle = await fetchDataInst(1);
        if (dataheureactuelle.length > 0) {
            const heureactuelle = dataheureactuelle[0]._time;
            let dateObj = new Date(heureactuelle);

            // Récupération des composants de la date et de l'heure
            let day = dateObj.getDate().toString().padStart(2, '0');
            let month = (dateObj.getMonth() + 1).toString().padStart(2, '0'); // Janvier = 0
            let year = dateObj.getFullYear();
            let formattedDate = `${day}/${month}/${year}`;

            let hours = dateObj.getHours().toString().padStart(2, '0');
            let minutes = dateObj.getMinutes().toString().padStart(2, '0');
            let formattedTime = `${hours}:${minutes}`;

            // Mettre à jour les éléments HTML
            document.getElementById("lastDate").textContent = formattedDate;
            document.getElementById("lastUpdate").textContent = "Dernier relevé : " + formattedTime;
        } else {
            document.getElementById("lastDate").textContent = "Date du dernier relevé : Aucune donnée disponible";
            document.getElementById("lastUpdate").textContent = "Dernier relevé : Aucune donnée disponible";
        }
    } catch (error) {
        console.error("Erreur lors de la récupération des données :", error);
        document.getElementById("lastDate").textContent = "Erreur lors du chargement de la date";
        document.getElementById("lastUpdate").textContent = "Erreur lors du chargement de l'heure";
    }
}

// Appel de la fonction pour afficher la date et l'heure du dernier relevé
updateLastUpdate();

let period = "0.25"; // Valeur par défaut (1 jour)

document.getElementById("periodSelect").addEventListener("change", function () {
    period = this.value;
    console.log("Période sélectionnée :", period);
    displayValues(); // Rafraîchir les valeurs avec la nouvelle période
});

document.addEventListener('DOMContentLoaded', function () {
    console.log("DOM entièrement chargé");

    // Afficher le graphique par défaut (0.25) au chargement de la page
    fetchAndPlotHistogramP(0.25, 'histogramP');

    // Attacher l'événement au menu déroulant pour mettre à jour le graphique
    document.getElementById('periodSelect').addEventListener('change', function () {
        console.log('Changement de période détecté :', this.value);
        const selectedPeriod = parseFloat(this.value);
        fetchAndPlotHistogramP(selectedPeriod, 'histogramP');
    });

    fetchAndPlotHistogramETP(0.25, 'histogramETP');

    // Attacher l'événement au menu déroulant pour mettre à jour le graphique
    document.getElementById('periodSelect').addEventListener('change', function () {
        console.log('Changement de période détecté :', this.value);
        const selectedPeriod = parseFloat(this.value);
        fetchAndPlotHistogramETP(selectedPeriod, 'histogramETP');
    });
});

const chartConfigs = [
    {
        param: 1,
        divId: "thermoChart",
        drawFunction: (data) => {
            const currentVal = data.inst[0]?._value ?? 0;
            const max = data.res[0]?.max ?? 0;
            const min = data.res[0]?.min ?? 0;
            const avg = data.res[0]?.moyenne ?? 0;
            displayThermometer(currentVal, min, max, avg, "thermoChart");
        }
    },
    {
        param: 2,
        divId: "humidityMeter",
        drawFunction: (data) => {
            const currentVal = data.inst[0]?._value ?? 0;
            const max = data.res[0]?.max ?? 0;
            const min = data.res[0]?.min ?? 0;
            const avg = data.res[0]?.moyenne ?? 0;
            drawHygrometrie(currentVal, min, max, avg, "humidityMeter");
        }
    },
    {
        param: 3,
        divId: "pressuremeter",
        drawFunction: (data) => {
            const currentVal = data.inst[0]?._value ?? 0;
            const max = data.res[0]?.max ?? 0;
            const min = data.res[0]?.min ?? 0;
            const avg = data.res[0]?.moyenne ?? 0;
            drawPressureGauge(currentVal, min, max, avg, "pressuremeter");
        }
    },
    {
        param: 4,
        divId: "fluxsolaire",
        drawFunction: (data) => {
            const currentVal = data.inst[0]?._value ?? 0;
            const maximum = data.res[0]?.max ?? 0;
            const cumul = (data.res[0]?.moyenne ?? 0) * 24;
            displayFlux_solaire(currentVal, maximum, cumul, "fluxsolaire");
        }
    },
    {
        param: [5, 6],
        divId: "beaufort",
        drawFunction: async () => {
            try {
                // Obtener datos RES e INST para ambos parámetros
                const [res5, res6] = await Promise.all([fetchDataRes(5), fetchDataRes(6)]);
                const [inst5, inst6] = await Promise.all([fetchDataInst(5), fetchDataInst(6)]);

                // Extraer valores (usando operador nullish coalescing ?? y optional chaining ?.)
                const currentVal = inst5[0]?._value ?? 0;
                const valmin = res5[0]?.min ?? 0;
                const valmoy = res5[0]?.moyenne ?? 0;
                const valmax = res6[0]?.max ?? 0;

                // Actualizar lastDate con el dato más reciente
                if (inst5[0]?._time) lastDate = inst5[0]._time;

                console.log("Datos para Beaufort:", { currentVal, valmin, valmoy, valmax });
                displaywind(currentVal, lastDate, valmoy, valmin, valmax, "beaufort");
            } catch (error) {
                console.error("Error en drawFunction de beaufort:", error);
            }
        }
    },
    {
        param: 7,
        divId: "rose",
        drawFunction: (data) => {
            const currentVal = data.inst[0]?._value ?? 0;
            drawwindrose(currentVal, "rose");
        }
    },
];

async function displayValues() {
    for (let config of chartConfigs) {
        try {
            const resData = await fetchDataRes(config.param);
            const instData = await fetchDataInst(config.param);
            console.log(`Datos para param ${config.param}:`, { resData, instData });
            const data = { res: resData, inst: instData };
            config.drawFunction(data);
        } catch (error) {
            console.error(`Error al procesar el parámetro ${config.param}:`, error);
        }
    }
}

displayValues();

// Modificar fetchDataRes y fetchDataInst para debug
async function fetchDataRes(param) {
    const url = `http://145.239.199.14/cgi-bin/barthe/provide_data.py?param=${param}&period=${period}`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        console.log(`Réponse RES pour param ${param} avec période ${period}:`, data);
        return data;
    } catch (error) {
        console.error(`Erreur dans fetchDataRes(${param}):`, error);
        return [];
    }
}

async function fetchDataInst(param) {
    const url = `http://145.239.199.14/cgi-bin/barthe/provide_single_json.py?param=${param}`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        console.log(`Respuesta INST para param ${param}:`, data); // Debug
        return data;
    } catch (error) {
        console.error(`Error en fetchDataInst(${param}):`, error);
        return [];
    }
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

function resizeCanvas(canvas) {
    const container = canvas.parentElement;
    canvas.width = container.clientWidth; // Ajuste la largeur du canvas
    canvas.height = container.clientHeight; // Ajuste la hauteur du canvas
}

function field_disp(field_name) {
    if (field_name == "thermoChart" || field_name == 1) {
        return "Temp&eacute;rature de l'air";
    } else if (field_name == "humidityMeter" || field_name == 2) {
        return "Hygrom&eacute;trie";
    } else if (field_name == "pressuremeter" || field_name == 3) {
        return "Pression atmosph&eacute;rique";
    } else if (field_name == "fluxsolaire" || field_name == 4) {
        return "Flux solaire";
    } else if (field_name == "divChart5" || field_name == 6) {
        return "Precipitations";
    } else if (field_name == "divChart6" || field_name == 8) {
        return "ETP";
    } else if (field_name == "beaufort" || field_name == 5) {
        return "Vitesse du vent";
    } else if (field_name == "rose" || field_name == 7) {
        return "Direction du vent"
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

function displayThermometer(val, valmin, valmax, valmoy, div) {
    var canvas = document.getElementById(div);
    var ctx = canvas.getContext("2d");
    resizeCanvas(canvas);

    // Paramètres du thermomètre
    var min_value = -20; // Valeur minimale
    var max_value = 50;  // Valeur maximale
    var x = 100; // Position horizontale du rectangle
    var y = 60;  // Position verticale du haut du rectangle
    var width = 50;
    var height = 300;
    var circleRadius = 45;  // Rayon du cercle à la base
    var circleTopOffset = 35;  // Décalage du cercle par rapport à la base du rectangle

    // Effacer le canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Dessiner le contour du thermomètre (rectangle)
    ctx.beginPath();
    ctx.rect(x, y, width, height);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 0.75;
    ctx.stroke();

    // Demi cercle en haut du thermomètre
    ctx.beginPath();
    ctx.arc(x + width / 2, y - 2, width / 2, Math.PI, 0, false);
    ctx.fillStyle = '#FFFFFF'; // Remplissage blanc
    ctx.fill();
    ctx.strokeStyle = '#000'; // Couleur du contour
    ctx.stroke();

    // Rectangle pour cacher les traits
    ctx.beginPath();
    ctx.rect(x + 1, y - 5, width - 2, 6);
    ctx.fillStyle = '#FFFFFF'; // Remplissage blanc
    ctx.fill();

    // Dessiner un cercle vide à la base du thermomètre
    ctx.beginPath();
    ctx.arc(x + width / 2, y + height + circleTopOffset, circleRadius, 0, Math.PI * 2, false);
    ctx.fillStyle = '#FFFFFF'; // Remplissage blanc
    ctx.fill();
    ctx.lineWidth = 0.75; // Largeur de la bordure
    ctx.strokeStyle = '#000'; // Couleur du contour
    ctx.stroke();

    // Dessiner le cercle rempli à la base du thermomètre
    ctx.beginPath();
    ctx.arc(x + width / 2, y + height + circleTopOffset, 30, 0, Math.PI * 2, false);
    ctx.fillStyle = '#FF0000'; // Remplissage rouge
    ctx.fill();
    ctx.lineWidth = 0.75; // Largeur de la bordure

    // Calculer la hauteur du remplissage en fonction de la valeur
    var ratio = (val - min_value) / (max_value - min_value);
    var fillHeight = ratio * height;  // La hauteur du rectangle exclut le cercle

    // Fonction pour convertir une valeur en position Y sur l'axe du thermomètre
    function valueToY(value) {
        return y + height - ((value - min_value) / (max_value - min_value)) * height;
    }

    // Fonction pour dessiner un triangle (flèche) pointant vers la gauche
    function drawTriangle(ctx, x, y, color) {
        ctx.beginPath();
        ctx.moveTo(x, y);       // Pointe de la flèche vers la gauche
        ctx.lineTo(x + 10, y - 10); // Coin haut droit
        ctx.lineTo(x + 10, y + 10); // Coin bas droit
        ctx.closePath();
        ctx.fillStyle = color; // Couleur de la flèche
        ctx.fill();
    }

    // Calculer les positions Y pour min et max
    let yMin = valueToY(valmin);
    let yMax = valueToY(valmax);
    let yMoy = valueToY(valmoy);

    // Position horizontale des flèches et des légendes
    let arrowX = x + width + 5; // Position X des flèches
    let textX = arrowX + 15; // Position X du texte (légende)

    // Dessiner les triangles (flèches) à droite du thermomètre
    drawTriangle(ctx, arrowX, yMin, 'blue'); // Pour min
    drawTriangle(ctx, arrowX, yMax, 'darkred'); // Pour max
    drawTriangle(ctx, arrowX, yMoy, 'black'); // Pour moy

    // Ajouter la légende des valeurs à droite des flèches
    ctx.font = '16px Arial';
    ctx.fillStyle = 'black';
    ctx.textAlign = 'left';
    ctx.fillText("moyenne : " + format_num(valmoy.toFixed(1)) + " °C", textX, yMoy + 4);

    ctx.font = '16px Arial';
    ctx.fillStyle = 'blue';
    ctx.textAlign = 'left';
    ctx.fillText("minimum : " + format_num(valmin.toFixed(1)) + " °C", textX, yMin + 4);

    ctx.font = '16px Arial';
    ctx.fillStyle = 'darkred';
    ctx.textAlign = 'left';
    ctx.fillText("maximum : " + format_num(valmax.toFixed(1)) + " °C", textX, yMax + 4);

    // Ajouter la graduation sur le côté gauche
    ctx.font = '16px Arial';
    ctx.fillStyle = '#333';
    ctx.textAlign = 'right';
    for (let i = 1; i <= 7; i++) { // Commencer à 1 pour éviter d'afficher -20
        let gradValue = min_value + (i * 10);
        let gradY = y + height - (i * (height / 7));
        ctx.fillText(format_num(gradValue), x - 10, gradY + 5);

        // Dessiner un petit trait pour chaque graduation
        ctx.beginPath();
        ctx.moveTo(x - 5, gradY);
        ctx.lineTo(x, gradY);
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 0.75;
        ctx.stroke();
    }

    // Afficher la valeur numérique au-dessus du thermomètre
    ctx.font = '26px Arial';
    ctx.fillStyle = '#FF0000';
    ctx.textAlign = 'center';
    ctx.fillText(format_num(val.toFixed(1)) + " °C", x + width / 2, y - 35);

    // Fonction d'animation pour remplir le rectangle
    var currentFillHeight = 0;
    function animateFill() {
        if (currentFillHeight < fillHeight) {
            currentFillHeight += 2; // Augmenter la hauteur de remplissage progressivement
            if (currentFillHeight > fillHeight) {
                currentFillHeight = fillHeight; // Assurer que la hauteur ne dépasse pas la valeur finale
            }
            // Effacer le rectangle de remplissage précédent
            ctx.clearRect(x + (width / 4), y, width / 2, height);
            // Dessiner le nouveau rectangle de remplissage
            ctx.beginPath();
            ctx.rect(x + (width / 4), y + height - currentFillHeight, width / 2, currentFillHeight);
            ctx.fillStyle = '#FF0000'; // Remplissage rouge
            ctx.fill();

            // Redessiner les rectangles blancs
            ctx.beginPath();
            ctx.rect(x + 2, y + height - currentFillHeight, (width / 4) - 2, currentFillHeight);
            ctx.fillStyle = '#FFFFFF'; // Remplissage blanc
            ctx.fill();

            ctx.beginPath();
            ctx.rect(x + (3 * width) / 4, y + height - currentFillHeight, (width / 4) - 1, currentFillHeight);
            ctx.fillStyle = '#FFFFFF'; // Remplissage blanc
            ctx.fill();

            // Redessiner le rectangle rouge à la base
            ctx.beginPath();
            ctx.rect(x + (width / 4), y + height, (width / 2), 35);
            ctx.fillStyle = '#FF0000'; // Remplissage rouge
            ctx.fill();

            // Appeler requestAnimationFrame pour continuer l'animation
            requestAnimationFrame(animateFill);
        }
    }

    // Démarrer l'animation de remplissage
    animateFill();
}

function drawHygrometrie(val, valmin, valmax, valmoy, div) {
    var canvas = document.getElementById(div);
    var ctx = canvas.getContext("2d");
    resizeCanvas(canvas);

    var min_value = 0;
    var max_value = 100;
    var x = 100;
    var y = 65;
    var width = 50;
    var height = 365;
    var innerWidth = width * 0.5;
    var xInner = x + (width - innerWidth) / 2;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Dibujar solo el contorno una vez al principio
    ctx.beginPath();
    ctx.rect(x, y, width, height);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 0.95;
    ctx.stroke();

    var ratio = (val - min_value) / (max_value - min_value);
    var fillHeight = ratio * height;

    function valueToY(value) {
        return y + height - ((value - min_value) / (max_value - min_value)) * height;
    }

    function drawTriangle(ctx, x, y, color) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + 10, y - 10);
        ctx.lineTo(x + 10, y + 10);
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
    }

    let yMin = valueToY(valmin);
    let yMax = valueToY(valmax);
    let yMoy = valueToY(valmoy);

    let arrowX = x + width + 5;
    let textX = arrowX + 15;

    drawTriangle(ctx, arrowX, yMin, 'blue');
    drawTriangle(ctx, arrowX, yMax, 'darkred');
    drawTriangle(ctx, arrowX, yMoy, 'black');

    ctx.font = '16px Arial';
    ctx.fillStyle = 'black';
    ctx.textAlign = 'left';
    ctx.fillText("moyenne : " + format_num(valmoy.toFixed(1)) + " %", textX, yMoy + 4);

    ctx.fillStyle = 'blue';
    ctx.fillText("minimum : " + format_num(valmin.toFixed(1)) + " %", textX, yMin + 4);

    ctx.fillStyle = 'darkred';
    ctx.fillText("maximum : " + format_num(valmax.toFixed(1)) + " %", textX, yMax + 4);

    ctx.font = '16px Arial';
    ctx.fillStyle = '#333';
    ctx.textAlign = 'right';
    for (let i = 0; i <= 10; i++) {
        let gradValue = min_value + (i * 10);
        let gradY = y + height - (i * (height / 10));
        ctx.fillText(format_num(gradValue), x - 10, gradY + 5);
        ctx.beginPath();
        ctx.moveTo(x - 5, gradY);
        ctx.lineTo(x, gradY);
        ctx.stroke();
    }

    ctx.font = '26px Arial';
    ctx.fillStyle = '#00aaff';
    ctx.textAlign = 'center';
    ctx.fillText(format_num(val.toFixed(1)) + " %", x + width / 2, y - 35);

    var currentFillHeight = 0;
    function animateFill() {
        if (currentFillHeight < fillHeight) {
            currentFillHeight += 2;
            if (currentFillHeight > fillHeight) {
                currentFillHeight = fillHeight;
            }

            // Limpiar solo el área del relleno interior
            ctx.clearRect(xInner, y, innerWidth, height);

            // Redibujar el relleno de la barra
            ctx.beginPath();
            ctx.rect(xInner, y + height - currentFillHeight, innerWidth, currentFillHeight);
            ctx.fillStyle = '#00aaff';
            ctx.fill();
            requestAnimationFrame(animateFill);
        }
    }
    animateFill();

    // Dibuja la gota de agua azul con el símbolo de %
    function drawWaterDrop(x, y, size) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x - size / 1.90, y + size * 1.5);
        ctx.lineTo(x + size / 1.90, y + size * 1.5);
        ctx.closePath();
        ctx.fillStyle = '#00aaff';
        ctx.fill();

        // Dibujar el círculo en la base del triángulo
        ctx.beginPath();
        ctx.arc(x, y + size * 1.5, size / 1.97, 0, Math.PI * 2);
        ctx.fillStyle = '#00aaff';
        ctx.fill();
    }

    // Dibujar la gota de agua al lado de la barra
    var dropX = x + width + 45; // Ajusta la posición de la gota
    var dropY = y + height - 140; // Centrada verticalmente
    var dropSize = 60;
    drawWaterDrop(dropX, dropY, dropSize);

    // Añadir el símbolo de porcentaje dentro de la gota
    ctx.font = '24px Arial';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.fillText('%', dropX, dropY + 80); // Ajustar posición para centrar el símbolo
    ctx.fillText("HR", dropX, dropY + 104);
}

function drawPressureGauge(val, min, max, avg, div) {
    const canvas = document.getElementById(div);
    const ctx = canvas.getContext('2d');
    resizeCanvas(canvas);

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

    // Draw scale
    const totalSteps = 11; // 11 steps to include 400, 500, ..., 1400
    const stepSize = (maxValue - minValue) / (totalSteps - 1);
    for (let i = 0; i < totalSteps; i++) {
        const value = minValue + i * stepSize;
        const angle = (value - minValue) / (maxValue - minValue) * Math.PI * 1.5 + Math.PI / 4 + Math.PI / 2;
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
        if (i >= 0) {
            ctx.font = '14px Arial';
            ctx.fillStyle = '#000000';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(format_num(value.toFixed(0)), centerX + Math.cos(angle) * (radius - 45), centerY + Math.sin(angle) * (radius - 45));
        }
    }

    // Draw the gauge labels
    ctx.font = '24px Arial';
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('hPa', centerX, centerY - radius + 180);

    ctx.font = '16px Arial';
    ctx.fillText('Valeur', centerX, centerY + 80);
    ctx.fillText('moyenne', centerX, centerY + 92);
    ctx.font = 'bold 16px Arial';
    ctx.fillText(format_num(avg.toFixed(1)) + "hPa", centerX, centerY + 115);

    // Draw multi-line text for "Valeur maximale" and "Valeur minimale"
    const lineHeight = 12; // Height of each line
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // "Valeur maximale"
    ctx.fillStyle = 'darkred';
    ctx.font = '16px Arial';
    ctx.fillText('Valeur', centerX - 70, centerY + 200 - lineHeight / 2);
    ctx.fillText('maximale', centerX - 70, centerY + 200 + lineHeight / 2);
    ctx.font = 'bold 16px Arial';
    ctx.fillText(format_num(max) + "hPa", centerX - 70, centerY + 200 + 2 * lineHeight);

    // "Valeur minimale"
    ctx.fillStyle = 'blue';
    ctx.font = '16px Arial';
    ctx.fillText('Valeur', centerX + 70, centerY + 200 - lineHeight / 2);
    ctx.fillText('minimale', centerX + 70, centerY + 200 + lineHeight / 2);
    ctx.font = 'bold 16px Arial';
    ctx.fillText(format_num(min) + "hPa", centerX + 70, centerY + 200 + 2 * lineHeight);

    // Draw the needle
    const angle = ((val - minValue) / (maxValue - minValue)) * Math.PI * 1.5 + Math.PI / 4 + Math.PI / 2;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(centerX + Math.cos(angle) * (radius - 50), centerY + Math.sin(angle) * (radius - 50));
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#ff0000';
    ctx.stroke();

    // Draw the point
    ctx.beginPath();
    ctx.arc(centerX, centerY, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#000000';
    ctx.fill();

    // Draw the value text
    ctx.font = '26px Arial';
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(format_num(val.toFixed(2)) + ' hPa', centerX, centerY - 180);
}

function displayFlux_solaire(val, maximum, cumul, div) {
    var canvas = document.getElementById(div);
    var ctx = canvas.getContext("2d");
    resizeCanvas(canvas);

    // Parámetros del flujo solar
    var min_value = 0;
    var max_value = 1400;

    // Limpiar el canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Posición del sol y tamaño
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
        let x2 = centerX + Math.cos(angle) * (sunRadius + 60);
        let y2 = centerY + Math.sin(angle) * (sunRadius + 60);

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = "#DAA520";
        ctx.lineWidth = 5;
        ctx.stroke();
        ctx.closePath();
    }

    // Dibujar la escala vertical
    let scaleHeight = sunRadius; // Altura de la escala
    let step = scaleHeight / 7; // Espaciado entre marcas de la escala
    let maxValue = 1400; // Valor máximo de la escala

    // Dibujar la línea de la escala desde el centro hacia arriba
    ctx.beginPath();
    ctx.moveTo(centerX, centerY); // Empieza en el centro del sol
    ctx.lineTo(centerX, centerY - scaleHeight); // Se extiende hacia arriba
    ctx.strokeStyle = "black";
    ctx.lineWidth = 2; // Grosor
    ctx.stroke();
    ctx.closePath();

    // Dibujar las marcas de la escala
    for (let i = 0; i <= 7; i++) {
        let y = centerY - i * step; // Ajuste para que las marcas suban
        let lineLength = 8; // Longitud de las marcas
        let value = (maxValue / 7) * i; // Cálculo del valor en cada marca

        // Dibujar la línea de la marca
        ctx.beginPath();
        ctx.moveTo(centerX - lineLength / 2, y);
        ctx.lineTo(centerX + lineLength / 2, y);
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.closePath();

        // Dibujar el número de la escala
        ctx.font = "14px Arial";
        ctx.fillStyle = "black";
        ctx.textAlign = "right";
        ctx.fillText(format_num(value), centerX - 10, y + 4);
    }

    // Dibujar el texto del flujo solar
    ctx.textAlign = "left";
    ctx.fillStyle = "black";
    ctx.font = "24px Arial";
    ctx.fillText(format_num(val) + " W/m²", centerX - 50, centerY + 40);

    // Dibujar flecha a la derecha de la escala (ajustada al valor máximo)
    const arrowWidth = 10;
    const arrowHeight = 15;
    const arrowOffset = 20;

    function drawArrow(x, y, label) {
        ctx.beginPath();
        ctx.moveTo(x + 5, y);
        ctx.lineTo(x + arrowOffset, y - arrowWidth / 2);
        ctx.lineTo(x + arrowOffset, y + arrowWidth / 2);
        ctx.closePath();
        ctx.fillStyle = "darkred";
        ctx.fill();

        // Dibujar el texto de la flecha
        ctx.font = "16px Arial";
        ctx.fillStyle = "darkred";
        ctx.textAlign = "left";
        ctx.fillText(label, x + arrowOffset + 5, y + 4);
    }

    // Calcular la posición de la flecha en función del valor máximo
    let maxArrowY = centerY - (maximum / maxValue) * scaleHeight;

    // Flecha para el valor máximo
    drawArrow(centerX, maxArrowY, "Max: " + format_num(maximum.toFixed(1)) + " W/m²");

    // Puissance solaire
    ctx.font = "24px Arial";
    ctx.fillStyle = "black";
    ctx.textAlign = "center";
    ctx.fillText("Irradiation solaire : " + format_num(cumul.toFixed(0)) + " Wh/m²", centerX, canvas.height);
}

function displaywind(val_inst, valtime, valmoy, valmin, valmax, div) {
    var canvas = document.getElementById(div);
    var ctx = canvas.getContext("2d");
    resizeCanvas(canvas);

    // Paramètres de l'échelle
    var min_value = 0;
    var max_value = 150;
    var x = 60; // Position horizontale du rectangle général
    var y = 230;  // Position verticale du haut du rectangle
    var width = 900;
    var height = 60;

    // Effacer le canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Dessiner le contour du rectangle
    ctx.beginPath();
    ctx.rect(x, y, width, height);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 0.5;
    ctx.stroke();

    // Échelle de Beaufort (Plages de vitesses du vent en km/h)
    var beaufortScale = [
        { level: 0, min: 0, max: 1 },   // Calme
        { level: 1, min: 1, max: 5 },   // Très faible
        { level: 2, min: 6, max: 11 },  // Faible
        { level: 3, min: 12, max: 19 }, // Modéré
        { level: 4, min: 20, max: 28 }, // Assez fort
        { level: 5, min: 29, max: 38 }, // Fort
        { level: 6, min: 39, max: 49 }, // Très fort
        { level: 7, min: 50, max: 61 }, // Tempête modérée
        { level: 8, min: 62, max: 74 }, // Tempête forte
        { level: 9, min: 75, max: 88 }, // Tempête violente
        { level: 10, min: 89, max: 102 }, // Ouragan faible
        { level: 11, min: 103, max: 117 }, // Ouragan fort
        { level: 12, min: 118, max: 150 } // Ouragan extrême
    ];

    // Calculer la largeur du remplissage en fonction de la valeur
    var ratio = (val_inst - min_value) / (max_value - min_value);
    var fillWidth = ratio * width;  // La hauteur du rectangle exclut le cercle

    // Fonction pour calculer la position X à partir de la valeur
    function valueToX(value) {
        return x + ((value - min_value) / (max_value - min_value)) * width;
    }

    // Fonction pour dessiner un triangle (flèche) pointant vers le bas
    function drawTriangle(ctx, x, y, color) {
        ctx.beginPath();
        ctx.moveTo(x, y);           // Pointe de la flèche vers le bas
        ctx.lineTo(x - 10, y - 10); // Coin haut gauche
        ctx.lineTo(x + 10, y - 10); // Coin haut droit
        ctx.closePath();
        ctx.fillStyle = color;       // Couleur dynamique
        ctx.fill();
    }

    function drawTriangleUp(ctx, x, y, color) {
        ctx.beginPath();
        ctx.moveTo(x, y);           // Pointe de la flèche vers le haut
        ctx.lineTo(x - 10, y + 10); // Coin bas gauche
        ctx.lineTo(x + 10, y + 10); // Coin bas droit
        ctx.closePath();
        ctx.fillStyle = color;       // Couleur dynamique
        ctx.fill();
    }

    // Calculer les positions X pour min et max
    let xMin = valueToX(valmin);
    let xMax = valueToX(valmax);
    // Calculer la position X pour valmoy
    let xMoy = valueToX(valmoy);

    // Position verticale des flèches (juste au-dessus du rectangle)
    let arrowY = y - 10;  // Position des flèches juste au-dessus du rectangle
    // Calculer la position Y sous l'axe des graduations
    let belowY = y + height + 10;  // Position sous le rectangle

    // Dessiner les triangles (flèches) pour min et max
    drawTriangle(ctx, xMin, arrowY, 'blue'); // Flèche pour min
    drawTriangle(ctx, xMax, arrowY, 'darkred'); // Flèche pour max
    // Dessiner une flèche pour valmoy
    drawTriangleUp(ctx, xMoy, belowY, 'black');

    // Position pour afficher les légendes (valeurs min et max)
    let textY = arrowY - 15; // Position verticale du texte (légendes)

    // Ajouter la légende des valeurs à droite des flèches
    ctx.font = '16px Arial';
    ctx.fillStyle = 'black';
    ctx.textAlign = 'top';
    // Ajouter la légende de valmoy
    ctx.fillText("moyenne", xMoy - 35, belowY + 22);
    ctx.fillText(format_num(valmoy.toFixed(1)) + " km/h", xMoy - 35, belowY + 40);

    ctx.font = '16px Arial';
    ctx.fillStyle = 'blue';
    ctx.textAlign = 'top';
    ctx.fillText("minimum", xMin - 35, textY - 20); // Légende pour min
    ctx.fillText(format_num(valmin.toFixed(1)) + " km/h", xMin - 35, textY); 
    ctx.font = '16px Arial';
    ctx.fillStyle = 'darkred';
    ctx.textAlign = 'top';
    ctx.fillText("maximum", xMax - 35, textY - 20); // Légende pour max
    ctx.fillText(format_num(valmax.toFixed(1)) + " km/h", xMax - 35, textY);
    // Afficher la valeur numérique au-dessus du rectangle
    ctx.font = '24px Arial';
    ctx.fillStyle = '#000';
    ctx.textAlign = 'center';
    // Extraire l'heure et la minute
    let dateObj = new Date(valtime);
    let hours = dateObj.getHours().toString().padStart(2, '0'); // Assure deux chiffres
    let minutes = dateObj.getMinutes().toString().padStart(2, '0'); // Assure deux chiffres
    let formattedTime = hours + ":" + minutes;

    // Affichage avec l'heure formatée
    ctx.fillStyle = 'rgb(146, 110, 42)'
    ctx.fillText("Vitesse actuelle :  " + format_num(val_inst.toFixed(1)) + " km/h", x + width / 2, y - 60);

    // Dessiner les graduations verticales (tous les 10)
    ctx.font = '14px Arial';
    ctx.fillStyle = '#333';
    ctx.textAlign = 'center';  // Centrer le texte sous les graduations
    for (let i = 0; i <= 15; i++) {  // 150 / 10 = 15 graduations
        let gradValue = min_value + (i * 10);  // Espacement de 10
        let gradX = x + (i * (width / 15));    // Position horizontale de chaque graduation
        let gradY = y + height;  // Position du trait inférieur du rectangle

        // Affichage du texte sous chaque graduation
        ctx.fillText(format_num(gradValue), gradX, gradY + 15);  // Le texte est placé 15px sous le bas du rectangle

        // Dessiner un petit trait vertical pour chaque graduation
        ctx.beginPath();
        ctx.moveTo(gradX, gradY);  // Position de la graduation sur la ligne inférieure du rectangle
        ctx.lineTo(gradX, gradY - 5);  // Traînée de graduation de 5px
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 0.75;
        ctx.stroke();
    }

    // Calculer la position des lignes verticales pour valmin et valmax
    var posValMin = x + ((valmin - min_value) / (max_value - min_value)) * width;
    var posValMax = x + ((valmax - min_value) / (max_value - min_value)) * width;

    // Fonction d'animation pour remplir le rectangle
    var currentfillWidth = 0;
    function animateFill() {
        if (currentfillWidth < fillWidth) {
            currentfillWidth += 2; // Augmenter la largeur de remplissage progressivement
            if (currentfillWidth > fillWidth) {
                currentfillWidth = fillWidth; // Assurer que la largeur ne dépasse pas la valeur finale
            }

            // Redessiner le rectangle principal
            ctx.beginPath();
            ctx.rect(x, y, width, height);
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 0.5;
            ctx.stroke();

            // Redessiner le remplissage
            ctx.beginPath();
            ctx.rect(x, y, currentfillWidth, height);
            ctx.fillStyle = 'rgba(208, 154, 54, 0.25)'; // Remplissage marron
            ctx.fill();

            // Redessiner les lignes rouges pour valmin et valmax
            ctx.beginPath();
            ctx.moveTo(posValMin, y);
            ctx.lineTo(posValMin, y + height);  // Dessiner la ligne verticale de valmin
            ctx.moveTo(posValMax, y);
            ctx.lineTo(posValMax, y + height);  // Dessiner la ligne verticale de valmax
            ctx.strokeStyle = '#FF0000';  // Couleur des lignes (rouge)
            ctx.lineWidth = 1;
            ctx.stroke();

            // Appeler requestAnimationFrame pour continuer l'animation
            requestAnimationFrame(animateFill);
        }
    }

    // Démarrer l'animation de remplissage
    animateFill();

    beaufortScale.forEach(function (scale) {
        var posMin = x + ((scale.min - min_value) / (max_value - min_value)) * width;
        var posMax = x + ((scale.max - min_value) / (max_value - min_value)) * width;

        // Calculer la position du centre du rectangle
        var middlePos = (posMin + posMax) / 2; // Calculer le milieu du rectangle

        // Dessiner la ligne verticale pour chaque niveau de Beaufort au centre de l'intervalle
        ctx.beginPath();
        ctx.moveTo(posMin, y);
        ctx.lineTo(posMin, y + height);  // Traçage d'une seule ligne au centre
        ctx.strokeStyle = '#000000';  // Couleur des lignes (bleu par exemple)
        ctx.lineWidth = 1;
        ctx.stroke();

        // Placer le numéro de Beaufort au centre du rectangle
        ctx.font = '14px Arial';
        ctx.fillStyle = '#333333';
        ctx.textAlign = 'center';
        ctx.fillText(scale.level, middlePos, y + height / 2);  // Placer le texte au milieu verticalement
    });
}

function drawwindrose(windDirection, div) {
    const canvas = document.getElementById(div);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const scale = 0.9; // Ajustar el tamaño para que sea un poco más grande
    const size = 1000 * scale;
    canvas.width = size;
    canvas.height = size;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    ctx.scale(scale, scale);
    
    const centerX = 500 / 2;
    const centerY = 500 / 2;
    const radius = 180;
    
    ctx.clearRect(0, 0, 300, 300);
    
    // Dibujar círculo exterior
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius*0.8, 0, Math.PI * 2);
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#0A2845';
    ctx.stroke();

    // Dibujar círculo más exterior
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#0A2845';
    ctx.stroke();
    
    // Función para dibujar una estrella de 8 puntas en el centro con 4 puntas más grandes
    function drawStarWithTriangles(cx, cy, spikes, outerRadius, innerRadius, color) {
        let angleStep = (Math.PI * 2) / spikes; // Ángulo entre cada punta
        let centerRadius = innerRadius * 0.5; // Radio para el centro relleno
    
        ctx.fillStyle = color;
    
        // Primero dibujamos el centro relleno (polígono central) con una rotación de π/8
        ctx.beginPath();
        for (let i = 0; i < spikes; i++) {
            let angle = i * angleStep + Math.PI / 8; // Rotación para alinear el polígono
            let x = cx + Math.cos(angle) * innerRadius;
            let y = cy + Math.sin(angle) * innerRadius;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
    
        // Luego dibujamos los triángulos con puntas intercaladas más bajas
        for (let i = 0; i < spikes; i++) {
            let angle = i * angleStep;
    
            // Puntas principales (más largas)
            let currentOuterRadius = (i % 2 === 0) ? outerRadius : outerRadius * 0.8;
            let currentInnerRadius = innerRadius;
    
            // Puntos de los triángulos
            let x1 = cx + Math.cos(angle) * currentOuterRadius;
            let y1 = cy + Math.sin(angle) * currentOuterRadius;
    
            let x2 = cx + Math.cos(angle + Math.PI / spikes) * currentInnerRadius;
            let y2 = cy + Math.sin(angle + Math.PI / spikes) * currentInnerRadius;
    
            let x3 = cx + Math.cos(angle - Math.PI / spikes) * currentInnerRadius;
            let y3 = cy + Math.sin(angle - Math.PI / spikes) * currentInnerRadius;
    
            // Dibujar el triángulo
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.lineTo(x3, y3);
            ctx.closePath();
            ctx.fill();
        }
    }
    
    // Dibujar estrella con el centro relleno
    drawStarWithTriangles(centerX, centerY, 8, radius * 0.8, radius * 0.4, '#94c3fa');
    
    // Letras
    ctx.font = 'bold 16px Arial';
    ctx.fillStyle = '#0A2845';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    ctx.fillText('N', centerX, centerY - radius * 1.1);
    ctx.fillText('E', centerX + radius * 1.1, centerY);
    ctx.fillText('S', centerX, centerY + radius * 1.1);
    ctx.fillText('W', centerX - radius * 1.1, centerY);
    
    // Dibujar las líneas de graduación
    const numGraduations = 16; // Número de líneas de graduación
    const angleStep = 2 * Math.PI / numGraduations;
    for (let i = 0; i < numGraduations; i++) {
        const angle = i * angleStep;
        const xStart = centerX + Math.cos(angle) * (radius * 0.8);
        const yStart = centerY + Math.sin(angle) * (radius * 0.8);
        const xEnd = centerX + Math.cos(angle) * radius;
        const yEnd = centerY + Math.sin(angle) * radius;
        
        ctx.beginPath();
        ctx.moveTo(xStart, yStart);
        ctx.lineTo(xEnd, yEnd);
        ctx.strokeStyle = '#0A2845';
        ctx.lineWidth = 1;
        ctx.stroke();
    }
    
    // Dibujar la flecha del viento
    const arrowLength = radius * 0.7; // Longitud fija de la flecha
    const arrowAngle = (windDirection + 90) * (Math.PI / 180); // Convertir a radianes
    
    const xEnd = centerX + Math.cos(arrowAngle) * arrowLength;
    const yEnd = centerY - Math.sin(arrowAngle) * arrowLength;
    
    ctx.strokeStyle = '#ff0215';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(xEnd, yEnd);
    ctx.stroke();

    // Draw the point
    ctx.beginPath();
    ctx.arc(centerX, centerY, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#000000';
    ctx.fill();
    
    // Punta de la flecha
    ctx.beginPath();
    ctx.moveTo(xEnd, yEnd);
    ctx.lineTo(xEnd - 10 * Math.cos(arrowAngle - Math.PI / 6), yEnd + 10 * Math.sin(arrowAngle - Math.PI / 6));
    ctx.lineTo(xEnd - 10 * Math.cos(arrowAngle + Math.PI / 6), yEnd + 10 * Math.sin(arrowAngle + Math.PI / 6));
    ctx.closePath();
    ctx.fillStyle = '#ff0215';
    ctx.fill();
}



async function fetchDataResPETP(param, period) {
    const url = `http://145.239.199.14/cgi-bin/barthe/provide_data.py?param=${param}&period=${period}`;
    const response = await fetch(url);
    const jsonData = await response.json();
    return jsonData;
}

async function fetchHourlySums(param, time) {
    const cumuls = [];
    const step = 0.04166; // 1 heure = 1/24 de jour
    let period = time;
    const totalHours = time * 24;
    for (let i = 0; i < totalHours; i++) {
        const data = await fetchDataResPETP(param, period);
        const currentSum = data[0].cumul;
        const nextperiod = period - step;
        const nextPeriodData = await fetchDataResPETP(param, nextperiod);
        const nextPeriodSum = nextPeriodData[0].cumul;
        const hourlySum = currentSum - nextPeriodSum;
        cumuls.push(hourlySum);
        period -= step;
    }
    return cumuls;
}

function generatehourlyLabels(time) {
    const currentDate = new Date();
    const currentHour = currentDate.getHours();
    const currentMinute = currentDate.getMinutes();
    const hoursToSubtract = time * 24;
    let startingHour = currentHour - hoursToSubtract;

    if (startingHour < 0) {
        startingHour += 24;
    }

    const labels = [];

    for (let i = 0; i <= time * 24; i++) {
        let labelHour = startingHour + i;

        if (labelHour > 23) {
            labelHour -= 24;
        }

        labelHour = labelHour < 10 ? `0${labelHour}` : labelHour;
        labels.push(`${labelHour}:${currentMinute < 10 ? '0' + currentMinute : currentMinute}`);
    }

    return labels;
}

function generateDailyLabels(days) {
    const currentDate = new Date();
    const labels = [];

    for (let i = 0; i <= days; i++) {
        const targetDate = new Date(currentDate);
        targetDate.setDate(currentDate.getDate() - (days - i));

        const day = targetDate.getDate();
        const month = targetDate.getMonth() + 1; // Les mois sont indexés à partir de 0

        const formattedDay = day < 10 ? `0${day}` : day;
        const formattedMonth = month < 10 ? `0${month}` : month;

        labels.push(`${formattedDay}/${formattedMonth}`);
    }

    return labels;
}

async function fetchDailySums(param, time) {
    const cumuls = [];
    const step = 1;
    let period = time;
    for (let i = 0; i < time; i++) {
        const data = await fetchDataResPETP(param, period);
        const currentSum = data[0].cumul;
        const nextperiod = period - step;
        const nextPeriodData = await fetchDataResPETP(param, nextperiod);
        const nextPeriodSum = nextPeriodData[0].cumul;
        const hourlySum = currentSum - nextPeriodSum;
        cumuls.push(hourlySum);
        period -= step;
    }
    return cumuls;
}

let myChart = null; // Variable globale pour stocker l'instance du graphique

function plotHistogramP(data, labels, canvasId, time) {
    const ctx = document.getElementById(canvasId).getContext('2d');

    // Détruire l'ancien graphique s'il existe
    if (myChart) {
        myChart.destroy();
    }

    let val_title = '';
    if (time > 1) {
        val_title = time + ' derniers jours';
    } else {
        const heures = time * 24;
        val_title = heures + ' dernières heures';
    }

    // Créer un nouveau graphique
    myChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Précipitations sur les ' + val_title,
                data: data,
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'mm'
                    }
                }
            }
        }
    });
}

async function fetchAndPlotHistogramP(time, canvasId) {
    if (time <= 1) {
        const hourlypluvio = await fetchHourlySums(8, time);
        const labels = generatehourlyLabels(time);
        plotHistogramP(hourlypluvio, labels, canvasId, time);
    } else {
        const dailypluvio = await fetchDailySums(8, time);
        const labels = generateDailyLabels(time);
        plotHistogramP(dailypluvio, labels, canvasId, time);
    }
}

async function fetchHourlyMeans(param, time) {
    // Initialisation d'un tableau pour stocker les moyennes horaires avec leurs heures respectives
    const moyennes = [];
    // Calcul du pas (step) en jours. On suppose que time est en jours.
    const step = 0.04166; // 1 heure = 1/24 de jour
    // Initialisation de la période de départ (la période totale en jours est donnée par la variable 'time')
    let period = time; // La période de départ est définie par l'utilisateur (en jours)
    // Calcul du nombre d'heures dans la période définie par 'time' (en jours)
    const totalHours = time * 24; // Nombre total d'heures dans la période (jours * 24)
    // Boucle pour calculer les moyennes horaires, sur totalHours heures
    for (let i = 0; i < totalHours; i++) {
        // Appel de la fonction fetchDataResPETP pour obtenir les données avec la période actuelle
        const data = await fetchDataResPETP(param, period);
        // Extraction de la moyenne pour la période actuelle
        const currentMean = data[0].moyenne;
        const nextperiod = period - step
        const nextPeriodData = await fetchDataResPETP(param, nextperiod); // Récupère les données pour la période réduite d'une heure
        const nextPeriodMean = nextPeriodData[0].moyenne; // Moyenne pour la période réduite
        // Calcul de la moyenne horaire (en soustrayant la moyenne sur 23 heures de la moyenne sur la période entière)
        const hourlyMean = (currentMean * period - nextPeriodMean * nextperiod) / (period - nextperiod);
        // Ajout de l'objet contenant l'heure et la moyenne horaire calculée dans le tableau
        moyennes.push(hourlyMean);
        // Réduction de la période pour l'itération suivante (réduction de la période de 1 heure)
        period -= step;
    }
    // Retourne le tableau des moyennes horaires avec leurs heures respectives
    return moyennes;
}

async function fetchDailyMeans(param, time) {
    // Initialisation d'un tableau pour stocker les moyennes horaires avec leurs heures respectives
    const moyennes = [];
    // Calcul du pas (step) en jours. On suppose que time est en jours.
    const step = 1; // 1 heure = 1/24 de jour
    // Initialisation de la période de départ (la période totale en jours est donnée par la variable 'time')
    let period = time; // La période de départ est définie par l'utilisateur (en jours)
    // Calcul du nombre d'heures dans la période définie par 'time' (en jours)
    // Boucle pour calculer les moyennes horaires, sur totalHours heures
    for (let i = 0; i < time; i++) {
        // Appel de la fonction fetchDataResPETP pour obtenir les données avec la période actuelle
        const data = await fetchDataResPETP(param, period);
        // Extraction de la moyenne pour la période actuelle
        const currentMean = data[0].moyenne;
        const nextperiod = period - step
        const nextPeriodData = await fetchDataResPETP(param, nextperiod); // Récupère les données pour la période réduite d'une heure
        const nextPeriodMean = nextPeriodData[0].moyenne; // Moyenne pour la période réduite
        // Calcul de la moyenne horaire (en soustrayant la moyenne sur 23 heures de la moyenne sur la période entière)
        const dailyMean = (currentMean * period - nextPeriodMean * nextperiod) / (period - nextperiod);
        // Ajout de l'objet contenant l'heure et la moyenne horaire calculée dans le tableau
        moyennes.push(dailyMean);
        // Réduction de la période pour l'itération suivante (réduction de la période de 1 heure)
        period -= step;
    }
    // Retourne le tableau des moyennes horaires avec leurs heures respectives
    return moyennes;
}

// Fonction de tracé de l'histogramme avec Chart.js
let myChart2 = null; // Variable globale pour stocker l'instance du graphique

function plotHistogramETP(data, labels, canvasId, time) {
    const ctx = document.getElementById(canvasId).getContext('2d');

    // Détruire l'ancien graphique s'il existe
    if (myChart2) {
        myChart2.destroy();
    }

    let val_title = '';
    if (time > 1) {
        val_title = time + ' derniers jours';
    } else {
        const heures = time * 24;
        val_title = heures + ' dernières heures';
    }

    // Créer un nouveau graphique
    myChart2 = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Evapotranspiration sur les ' + val_title,
                data: data,
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'mm'
                    }
                }
            }
        }
    });
}

async function fetchAndPlotHistogramETP(time, canvasId) {
    if (time <= 1) {
        const [hourlyMeansTemp, hourlyMeansHumidity, hourlyMeansWind, hourlyMeansSolarWh] = await Promise.all([
            fetchHourlyMeans(1, time),  // Température
            fetchHourlyMeans(2, time),  // Humidité
            fetchHourlyMeans(5, time),  // Vent
            fetchHourlyMeans(4, time)   // Rayonnement solaire (Wh/m²)
        ]);

        // Convertir le rayonnement solaire de Wh/m² à MJ/m²
        const hourlyMeansSolarMJ = hourlyMeansSolarWh.map(value => value * 0.0036);

        // Calculer l'ETP en utilisant les tableaux récupérés
        const hourlyMeansETP = ETP(hourlyMeansSolarMJ, hourlyMeansTemp, hourlyMeansHumidity, hourlyMeansWind);

        // Générer les labels allant de -(time * 24 - 1) à 0
        const labels = generatehourlyLabels(time);

        // Tracer l'histogramme
        plotHistogramETP(hourlyMeansETP, labels, canvasId, time);
    } else {
        // Récupérer toutes les moyennes en parallèle pour optimiser la vitesse
        const [dailyMeansTemp, dailyMeansHumidity, dailyMeansWind, dailyMeansSolarWh] = await Promise.all([
            fetchDailyMeans(1, time),  // Température
            fetchDailyMeans(2, time),  // Humidité
            fetchDailyMeans(5, time),  // Vent
            fetchDailyMeans(4, time)   // Rayonnement solaire (Wh/m²)
        ]);

        // Convertir le rayonnement solaire de Wh/m² à MJ/m²
        const dailyMeansSolarMJ = dailyMeansSolarWh.map(value => value * 0.0036);

        // Calculer l'ETP en utilisant les tableaux récupérés
        const dailyMeansETP = ETP(dailyMeansSolarMJ, dailyMeansTemp, dailyMeansHumidity, dailyMeansWind);

        // Générer les labels allant de -(time * 24 - 1) à 0
        const labels = generateDailyLabels(time);
        // Tracer l'histogramme
        plotHistogramETP(dailyMeansETP, labels, canvasId, time);

    }

}

function ETP(solar, temp, humidity, wind) {
    // Définir une pression atmosphérique standard en kPa (si non fournie)
    const pressure = 101.3; // kPa, pression standard au niveau de la mer

    // Calculer l'ETP pour chaque élément de la liste
    return solar.map((s, i) => {
        const tempK = temp[i] + 273.15;
        const e_s = 0.6108 * Math.exp((17.27 * temp[i]) / (temp[i] + 237.3));
        const e_a = e_s * (humidity[i] / 100);
        const VPD = e_s - e_a;
        const Rn = 0.77 * s;
        const gamma = 0.000665 * pressure;
        const Delta = (4098 * e_s) / Math.pow((temp[i] + 237.3), 2);
        const windms = wind[i] / 3.6;

        return (0.408 * Delta * (Rn - 0.34) + (900 / (tempK + 273)) * windms * VPD) / (Delta + gamma * (1 + 0.34 * windms));
    });
}

window.addEventListener('resize', () => {
    displayFlux_solaire(val, maximum, cumul, div);
});

setInterval(displayData, 5000);
