console.log("Debut du script");
divData = "div";
divChart = "div";
displayData();
var previous_val = [0,0,0,0,-100,0];
const val = [0,0,0,0,-100,0];
const step_val = [0,0,0,0,-100,0];
const step = [0,0,0,0,0,0];
var lastDate = new Date;
lastDate = lastDate.getTime();
var siteLocation = "Francon (La Barthe)";
var gauge_drawing = false;
var first_drawing = [true,true,true,true,true,true];

//displayFirstRecordData(); 

function dynamicGauge(){
    gauge_drawing = false;
    for(let i = 1;i<=6;i++){
        if(val[i-1] != previous_val[i-1]){
            step_val[i-1] += step[i-1];
            gauge_drawing = true;
        }
        if(val[i-1]>previous_val[i-1]){
            if(step_val[i-1]>=val[i-1]){
                step_val[i-1]=val[i-1];
                previous_val[i-1]=val[i-1];
            }
        }
        else{
            if(step_val[i-1]<=val[i-1]){
                step_val[i-1]=val[i-1];
                previous_val[i-1]=val[i-1];
            }
        }
    }

    if(gauge_drawing){
        displayFirstRecordData();
    }

    for(let i = 1;i<=6;i++){
        if(gauge_drawing || first_drawing[i-1]){
            console.log("Drawing...");
            displayGauge(param_num = i, val_gauge = step_val[i-1], `divChart${i}`);
            first_drawing[i-1] = false;
        }
    }
}

async function displayData() {
    if (typeof previous_val === 'undefined') {
        previous_val = [0,0,0,0,0,0];
    }
    previous_val = previous_val;
    try {
        console.log("p_val :", previous_val);
        for(let i = 1;i<=6;i++){
            param = i;
            divData = `divData${i}`;
            divChart = `divChart${i}`;
            //window.alert("Trying to get data...");
            const data = await fetchData(param);
            //window.alert(data[0]._value);
            lastDate = data[0]._time;
            val[i-1] = data[0]._value;
            if(val[i-1] != previous_val[i-1]){
                gauge_drawing = true;
                step[i-1] = (val[i-1] - previous_val[i-1])/20;
                step_val[i-1] = previous_val[i-1];
            }
        }
        console.log("val :", val);
    } catch (error) {
        console.error('Une erreur s\'est produite lors de la récupération des données :', error);
    }

    displayFirstRecordData();
    //dynamicGauge(val);
    //gauge_drawing = true;
}

function Date_display(dateDisp){
	dateDisp = new Date(dateDisp);
	//dateDisp = convertUTCDateToLocalDate(dateDisp);
	year = dateDisp.getFullYear(); 
	month = dateDisp.getMonth()+1; 
	day = dateDisp.getDate(); 
	hour = dateDisp.getHours(); 
	min =dateDisp.getMinutes(); 
	string_to_return = day + "/" + twoChars(month) + "/" + year + " &agrave; " + hour + ":" + twoChars(min);
	return(string_to_return);
    //return("le 14/10/2023 à 14:23");
}

function displayFirstRecordData() {
    for(let i = 1;i<=6;i++){
        const divData = `divData${i}`;
        const param_info = `<p><h2>${field_disp(i)}</h2></p>`;
        document.getElementById(divData).innerHTML = param_info;
    }
    const general_info = `<H1 style="font-family: Arial; color: #B45F04;"><p><b>Derni&egrave;re mesure : </b>le ${Date_display(lastDate)}</p>
        <p><b>Station :</b> ${capitalizeFirstLetter(siteLocation)}</p></H1>`;
    document.getElementById('divGeneral').innerHTML = general_info;
}

function field_disp(field_name){
    if(field_name == "temp_air" || field_name == 1){
        return("Temp&eacute;rature de l'air");
    }
    else if(field_name == "hygro_air" || field_name == 2){
        return("Hygrom&eacute;trie");
    }
    else if(field_name == "p_baro_mer" || field_name == 3){
        return("Pression atmosph&eacute;rique");
    }
    else if(field_name == "solar_flux" || field_name == 4){
        return("Flux solaire");
    }
    else if(field_name == "wind_speed" || field_name == 5){
        return("Vitesse du vent");
    }
    else if(field_name == "wind_speed_max" || field_name == 6){
        return("Vitesse du vent (rafales)");
    }
}

function twoChars(number){
	number = String(number);
	if(number.length < 2){
		number = "0" + String(number);
	}
	return(number);
};

function capitalizeFirstLetter(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function format_num(num){
    var num_str = num.toString();
    return num_str.replace(".",",");
}

// Conversion heure UTC en heure locale
function convertUTCDateToLocalDate(date) {
	var newDate = new Date(date.getTime()-date.getTimezoneOffset()*60*1000);
	return newDate; 				
};

async function fetchData(param) {
    const url = `http://145.239.199.14/cgi-bin/barthe/provide_single_json.py?param=${param}`;
	const response = await fetch(url);
    const jsonData = await response.json();
    return jsonData;
}
    
function displayGauge(param,val_disp,div){
    var canvas = document.getElementById(div);
    var ctx = canvas.getContext("2d");
    if(param==1){
        min_gauge = -20;
        max_gauge = 50;
        unit = "\u00B0C";
        digits = 1;
    }
    else if (param==2){
        min_gauge = 0;
        max_gauge = 100;
        unit = "%HR";
        digits = 1;
    }
    else if (param==3){
        min_gauge = 400;
        max_gauge = 1400;
        unit = "hPa";
        digits = 1;
    }
    else if (param==4){
        min_gauge = 0;
        max_gauge = 1400;
        unit = "W/m2";
        digits = 0;
    }
    else if (param==5){
        min_gauge = 0;
        max_gauge = 150;
        unit = "km/h";
        digits = 1;
    }
    else{
        min_gauge = 0;
        max_gauge = 150;
        unit = "km/h";
        digits = 1;
    }
    var nb_grad;
    var labels = [];
    var range_disp = max_gauge - min_gauge;
    var non_disp = 0;
    
    // Déterminer le nombre de graduations et la valeur de la première graduation
    nb_grad = 6;       
    if(range_disp >= 100000){
        multiplier = 10000;
    }
    else if(range_disp >= 10000){
        multiplier = 1000;
    }
    else if(range_disp >= 1000){
        multiplier = 100;
    }
    else if(range_disp >= 100){
        multiplier = 10;
    }            
    else{
        multiplier = 1;
    }
    var nombre = range_disp;
    while (nombre % (5*multiplier) !== 0) {
        nombre--;
    }
    non_disp = range_disp-nombre;
    nombre = Math.round(non_disp/2)-1 + min_gauge;
    while (nombre % (1*multiplier) !== 0) {
        nombre--;
    }
    start_grad = nombre;
    if(range_disp-(start_grad+(range_disp-non_disp))> start_grad+multiplier){
        start_grad += multiplier; 
    }
    for(let i=0;i<nb_grad;i++){
        labels[i] = start_grad + i*(range_disp-non_disp)/(nb_grad-1);
    }
    for(let i=0;i<nb_grad;i++){
        labels[i] = start_grad + i*(range_disp-non_disp)/(nb_grad-1);
    }
    if(labels[nb_grad-1]>max_gauge){
        for(let i=0;i<nb_grad;i++){
            labels[i]-=multiplier;
        }
    }
    
    // Coordonnées du centre du disque
    var centerX = canvas.width / 2;
    var centerY = canvas.height *0.9;

    // Angle de début et de fin du secteur angulaire (en radians)
    var startAngle = Math.PI; // 0 radians correspond à l'axe horizontal positif
    var endAngle = 0; // 90 degrés ou π/2 radians

    // Sens trigonométrique : false pour le sens des aiguilles d'une montre, true pour le sens inverse
    var anticlockwise = false;
    
    ctx.clearRect(0,0,500, 500);
    
    // Dessiner les graduations
    for (var i = 0; i < nb_grad; i++) {
        // Calculer l'angle en radians pour chaque graduation
        var angle = Math.PI + ((labels[i]-min_gauge)/range_disp*Math.PI);
        //var angle = Math.PI + (i / (2*nb_grad)) * (2 * Math.PI);

        // Calculer les coordonnées du point final de la ligne
        var x = centerX + 208 * Math.cos(angle); // 208 est le radius
        var y = centerY + 208 * Math.sin(angle);

        // Début du chemin pour dessiner la ligne
        ctx.beginPath();

        // Aller au centre du cadran
        ctx.moveTo(centerX, centerY);

        // Dessiner la ligne vers le point final
        ctx.lineTo(x, y);

        // Définir la couleur et l'épaisseur de la ligne
        ctx.strokeStyle = "black";
        ctx.lineWidth = 0.75;

        // Tracer la ligne
        ctx.stroke();
        
        ctx.font = "12px Arial";
        ctx.fillStyle = "black";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(labels[i], x + 15 * Math.cos(angle), y + 15 * Math.sin(angle));
    }
    
    // Secteur angulaire externe du cadran (remplissage)
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);

    ctx.arc(centerX, centerY, 202, startAngle, endAngle, anticlockwise);
    ctx.closePath();
     ctx.fillStyle = "white";
    ctx.fill();

    // Disque coloré externe de la jauge
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    endAngleGauge = Math.PI + ((val_disp-min_gauge)/range_disp*Math.PI);
    if(endAngleGauge > 2*Math.PI){
        endAngleGauge = 2*Math.PI;
    }
    else if(endAngleGauge < Math.PI){
        endAngleGauge = Math.PI;
    }
    ctx.arc(centerX, centerY, radius=190, startAngle, endAngleGauge, anticlockwise);
    ctx.closePath();
    ctx.fillStyle = "#DF7401";
    ctx.fill();
    
    // Disque blanc interne de la jauge (= masque)
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, 165, startAngle, endAngle, anticlockwise);
    ctx.closePath();
    ctx.fillStyle = "white";
    ctx.fill();
    
    // Secteur angulaire externe du cadran (tracé)
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);

    ctx.arc(centerX, centerY, 202, startAngle, endAngle, anticlockwise);
    ctx.closePath();
    ctx.strokeStyle = "black";
    ctx.lineWidth = 0.75;
    ctx.stroke();

    // Secteur angulaire interne du cadran
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, 153, startAngle, endAngle, anticlockwise);
    ctx.closePath();
    ctx.strokeStyle = "black";
    ctx.lineWidth = 0.75;
    ctx.stroke();
  
    // Disque blanc interne du cadran (= masque)
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, 153-0.75, startAngle+2, endAngle-2, anticlockwise);
    ctx.closePath();
    ctx.fillStyle = "white";
    ctx.fill();
    
    ctx.font = "60px Arial";
    ctx.fillStyle = "black";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(val_disp.toFixed(digits).replace(".",","), 250, 180);
    ctx.font = "24px Arial";
    ctx.fillText(unit, 250, 225);
}

setInterval(displayData,5000);
setInterval(dynamicGauge,50);

