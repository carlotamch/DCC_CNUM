console.log("Début du script");

async function fetchDataRes(param) { 
    const url = `http://145.239.199.14/cgi-bin/barthe/provide_data.py?param=${param}`;
    const response = await fetch(url);
    const jsonData = await response.json();
    return jsonData
}

async function fetchDataInst(param) { 
    const url = `http://145.239.199.14/cgi-bin/barthe/provide_single_json.py?param=${param}`;
    const response = await fetch(url);
    const jsonData = await response.json();
    return jsonData
}


async function displayValues() {
    const data_res = await fetchDataRes(1); // Appelle la fonction et attend la réponse
    const moy = data_res[0].moyenne
    const minimum =data_res[0].min
    const maximum=data_res[0].max
    const data_inst =await fetchDataInst(1)
    const val_inst = data_inst[0]._value
     // Appel de la fonction displaywind pour afficher le graphique avec les données récupérées
    displayThermometer(val_inst,moy, minimum, maximum, "thermoChart"); // Passer les valeurs à displaywind
}

// Appel de la fonction displayValues pour démarrer l'affichage des valeurs
displayValues();


function displayThermometer(val, valmoy, valmin, valmax, div) {
    var canvas = document.getElementById(div);
    var ctx = canvas.getContext("2d");

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
    ctx.font = '13px Arial';
    ctx.fillStyle = 'black';
    ctx.textAlign = 'left';
    ctx.fillText("moyenne : " + valmoy.toFixed(1) + " °C", textX, yMoy + 4);

    ctx.font = '13px Arial';
    ctx.fillStyle = 'blue';
    ctx.textAlign = 'left';
    ctx.fillText("minimum : " + valmin.toFixed(1) + " °C", textX, yMin + 4);

    ctx.font = '13px Arial';
    ctx.fillStyle = 'darkred';
    ctx.textAlign = 'left';
    ctx.fillText("maximum : " + valmax.toFixed(1) + " °C", textX, yMax + 4);

    // Ajouter la graduation sur le côté gauche
    ctx.font = '14px Arial';
    ctx.fillStyle = '#333';
    ctx.textAlign = 'right';
    for (let i = 1; i <= 7; i++) { // Commencer à 1 pour éviter d'afficher -20
        let gradValue = min_value + (i * 10);
        let gradY = y + height - (i * (height / 7));
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
    ctx.font = '24px Arial';
    ctx.fillStyle = '#FF0000';
    ctx.textAlign = 'center';
    ctx.fillText(val.toFixed(1) + " °C", x + width / 2, y - 35);

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


