console.log("Debut du script");
var previous_val = [0,0,0,0,-100,0];
const val = [0,0,0,0,-100,0];
const step_val = [0,0,0,0,-100,0];
const step = [0,0,0,0,0,0];
var lastDate = new Date;
lastDate = lastDate.getTime();
var siteLocation = "Francon (La Barthe)";
var gauge_drawing = false;
var first_drawing = [true,true,true,true,true,true];

async function fetchData(param) { 
    const url = `http://145.239.199.14/cgi-bin/barthe/provide_data.py?param=${param}`;
    try {
        const response = await fetch(url);
        const jsonData = await response.json();

        if (jsonData.length > 0) { // Vérifier que le tableau n'est pas vide
            const { moyenne, max, min } = jsonData[0]; // Extraction des valeurs
            console.log("Moyenne:", moyenne, "Max:", max, "Min:", min);
            return { moyenne, max, min }; // Retourne un objet contenant les valeurs
        } else {
            console.error("Données JSON vides !");
            return null;
        }
    } catch (error) {
        console.error("Erreur lors de la récupération des données:", error);
        return null;
    }
}

async function dataextraction() {
    const data = await fetchData(1); // Appelle la fonction et attend la réponse

    if (data) {
        const { moyenne, max, min } = data; // Extraction des valeurs dans des constantes
        console.log(`Moy: ${moyenne}, Min: ${min}, Max: ${max}`);
    }
}



function displayThermometer(valmoy,valmin,valmax, div) {
    var canvas = document.getElementById(div);
    var ctx = canvas.getContext("2d");
    
    // Paramètres du thermomètre
    var min_value = -10;
    var max_value = 50;
    var x = 100; // Position horizontale du rectangle
    var y = 50;  // Position verticale du haut du rectangle
    var width = 50;
    var height = 300;
    var height_carre = 50 ;
    var circleRadius = 45;  // Rayon du cercle à la base
    var circleTopOffset = 35;  // Décalage du cercle par rapport à la base du rectangle
    
    // Effacer le canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Dessiner le contour du thermomètre (rectangle)
    ctx.beginPath();
    ctx.rect(x, y, width, height);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 0.75;
    ctx.stroke()

    // Demi cercle en haut du thermomètre
    ctx.beginPath();
    ctx.arc(x + width / 2, y-2, width / 2, Math.PI, 0, false);
    ctx.fillStyle = '#FFFFFF'; // Remplissage blanc
    ctx.fill();
    ctx.strokeStyle = '#000'; // Couleur du contour
    ctx.stroke();

    // rectangle pour cacher les traits
    ctx.beginPath();
    ctx.rect(x+1 , y-5, width-2, 6);
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
    var ratio = (valmoy - min_value) / (max_value - min_value);
    var fillHeight = ratio * height ;  // La hauteur du rectangle exclut le cercle
    
    // Dessiner le remplissage du thermomètre (rectangle)
    ctx.beginPath();
    ctx.rect(x + (width/4), y + height - fillHeight, width/2, fillHeight);
    ctx.fillStyle = '#FF0000'; // Remplissage rouge
    ctx.fill();

    // un rectangle rouge a la base pour cacher
    ctx.beginPath();
    ctx.rect(x+(width/4), y + height, (width/2), 35);
    ctx.fillStyle = '#FF0000'; // Remplissage blanc
    ctx.fill();

    // deux rectangles blancs pour cacher
    ctx.beginPath();
    ctx.rect(x +2 , y + height - fillHeight , (width/4)-2, fillHeight);
    ctx.fillStyle = '#FFFFFF'; // Remplissage blanc
    ctx.fill();

    // deux rectangles blancs pour cacher
    ctx.beginPath();
    ctx.rect(x + (3*width)/4 , y + height - fillHeight , (width/4)-1, fillHeight);
    ctx.fillStyle = '#FFFFFF'; // Remplissage blanc
    ctx.fill();

    // Ajouter un triangle en forme de flèche pour min et max sur la droite
    // Fonction pour convertir une valeur en position Y sur l'axe du thermomètre
    function valueToY(value) {
        return y + height - ((value - min_value) / (max_value - min_value)) * height;
    }

    // Fonction pour dessiner un triangle (flèche) pointant vers la gauche
    function drawTriangle(ctx, x, y) {
        ctx.beginPath();
        ctx.moveTo(x, y);       // Pointe de la flèche vers la gauche
        ctx.lineTo(x + 10, y - 10); // Coin haut droit
        ctx.lineTo(x + 10, y + 10); // Coin bas droit
        ctx.closePath();
        ctx.fillStyle = 'black'; // Couleur de la flèche
        ctx.fill();
    }

    // Calculer les positions Y pour min et max
    let yMin = valueToY(valmin);
    let yMax = valueToY(valmax);

    // Position horizontale des flèches et des légendes
    let arrowX = x + width + 15; // Position X des flèches
    let textX = arrowX + 15; // Position X du texte (légende)

    // Dessiner les triangles (flèches) à droite du thermomètre
    drawTriangle(ctx, arrowX, yMin); // Pour min
    drawTriangle(ctx, arrowX, yMax); // Pour max

    // Ajouter la légende des valeurs à droite des flèches
    ctx.font = '13px Arial';
    ctx.fillStyle = 'black';
    ctx.textAlign = 'left';
    ctx.fillText(valmin.toFixed(1) + "°C", textX, yMin + 4);
    ctx.fillText(valmax.toFixed(1) + "°C", textX, yMax + 4);

    
    // Ajouter la graduation sur le côté gauche
    ctx.font = '14px Arial';
    ctx.fillStyle = '#333';
    ctx.textAlign = 'right';
    for (let i = 0; i <= 6; i++) {
        let gradValue = min_value + (i * 10);
        let gradY = y + height - (i * (height / 6));
        ctx.fillText(gradValue, x - 10, gradY + 5);
        
        // Dessiner un petit trait pour chaque graduation
        ctx.beginPath();
        ctx.moveTo(x - 5, gradY);
        ctx.lineTo(x, gradY);
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 0.75;
        ctx.stroke();
    }
    
    // Afficher la valeur numérique au-dessus du thermomètre
    ctx.font = '20px Arial';
    ctx.fillStyle = '#000';
    ctx.textAlign = 'center';
    ctx.fillText(valmoy.toFixed(1) + " °C", x + width / 2, y - 35);
}







displayThermometer(9.724, 4.2, 16.5,"thermoChart")