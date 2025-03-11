console.log("Debut du script");

async function fetchData(param) { 
    const url = `http://145.239.199.14/cgi-bin/barthe/provide_data.py?param=${param}`;
    const response = await fetch(url);
    const jsonData = await response.json();
    return jsonData
}

async function displayValues() {
    const data = await fetchData(5); // Appelle la fonction et attend la réponse
    const moy = data[0].moyenne
    const minimum =data[0].min
    const maximum=data[0].max

     // Appel de la fonction displaywind pour afficher le graphique avec les données récupérées
    displaywind(moy, minimum, maximum, "windChart"); // Passer les valeurs à displaywind
}

// Appel de la fonction displayValues pour démarrer l'affichage des valeurs
displayValues();


function displaywind(valmoy, valmin, valmax, div) {
    var canvas = document.getElementById(div);
    var ctx = canvas.getContext("2d");

    // Paramètres de l'échelle
    var min_value = 0;
    var max_value = 150;
    var x = 100; // Position horizontale du rectangle général
    var y = 60;  // Position verticale du haut du rectangle
    var width = 800;
    var height = 50;

    // Effacer le canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Dessiner le contour du rectangle
    ctx.beginPath();
    ctx.rect(x, y, width, height);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 0.75;
    ctx.stroke();

    // Échelle de Beaufort (Plages de vitesses du vent en km/h)
    var beaufortScale = [
        {level: 0, min: 0, max: 1},   // Calme
        {level: 1, min: 1, max: 5},   // Très faible
        {level: 2, min: 6, max: 11},  // Faible
        {level: 3, min: 12, max: 19}, // Modéré
        {level: 4, min: 20, max: 28}, // Assez fort
        {level: 5, min: 29, max: 38}, // Fort
        {level: 6, min: 39, max: 49}, // Très fort
        {level: 7, min: 50, max: 61}, // Tempête modérée
        {level: 8, min: 62, max: 74}, // Tempête forte
        {level: 9, min: 75, max: 88}, // Tempête violente
        {level: 10, min: 89, max: 102}, // Ouragan faible
        {level: 11, min: 103, max: 117}, // Ouragan fort
        {level: 12, min: 118, max: 150} // Ouragan extrême
    ];

    // Dessiner les lignes verticales pour l'échelle de Beaufort
    beaufortScale.forEach(function(scale) {
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
        ctx.font = '10px Arial';
        ctx.fillStyle = '#333333';
        ctx.textAlign = 'center';
        ctx.fillText(scale.level, middlePos, y + height / 2);  // Placer le texte au milieu verticalement
    });

    // Calculer la position des lignes verticales pour valmin et valmax
    var posValMin = x + ((valmin - min_value) / (max_value - min_value)) * width;
    var posValMax = x + ((valmax - min_value) / (max_value - min_value)) * width;

    // Ajouter des lignes verticales pour valmin et valmax
    ctx.beginPath();
    ctx.moveTo(posValMin, y);
    ctx.lineTo(posValMin, y + height);  // Dessiner la ligne verticale de valmin
    ctx.moveTo(posValMax, y);
    ctx.lineTo(posValMax, y + height);  // Dessiner la ligne verticale de valmax
    ctx.strokeStyle = '#FF0000';  // Couleur des lignes (rouge par exemple)
    ctx.lineWidth = 1;
    ctx.stroke();

    // Calculer la largeur du remplissage en fonction de la valeur
    var ratio = (valmoy - min_value) / (max_value - min_value);
    var fillWidth = ratio * width;  // La hauteur du rectangle exclut le cercle
    
    // Dessiner le remplissage du rectangle
    ctx.beginPath();
    ctx.rect(x, y , fillWidth, height);
    ctx.fillStyle = 'rgba(255, 165, 0, 0.5)'; // Remplissage gris transparent à 50%
    ctx.fill();
    
    // Fonction pour calculer la position X à partir de la valeur
    function valueToX(value) {
        return x + ((value - min_value) / (max_value - min_value)) * width;
    }

    // Fonction pour dessiner un triangle (flèche) pointant vers le bas
    function drawTriangle(ctx, x, y) {
        ctx.beginPath();
        ctx.moveTo(x, y);           // Pointe de la flèche vers le bas
        ctx.lineTo(x - 10, y - 10); // Coin haut gauche
        ctx.lineTo(x + 10, y - 10); // Coin haut droit
        ctx.closePath();
        ctx.fillStyle = 'red';       // Couleur de la flèche
        ctx.fill();
    }

    // Calculer les positions X pour min et max
    let xMin = valueToX(valmin);
    let xMax = valueToX(valmax);

    // Position verticale des flèches (juste au-dessus du rectangle)
    let arrowY = y - 10;  // Position des flèches juste au-dessus du rectangle

    // Dessiner les triangles (flèches) pour min et max
    drawTriangle(ctx, xMin, arrowY); // Flèche pour min
    drawTriangle(ctx, xMax, arrowY); // Flèche pour max

    // Position pour afficher les légendes (valeurs min et max)
    let textY = arrowY - 15; // Position verticale du texte (légendes)

    // Ajouter la légende des valeurs à droite des flèches
    ctx.font = '13px Arial';
    ctx.fillStyle = 'black';
    ctx.textAlign = 'top';
    ctx.fillText(valmin.toFixed(1) + " km/h", xMin, textY); // Légende pour min
    ctx.fillText(valmax.toFixed(1) + " km/h", xMax, textY); // Légende pour max

    // Afficher la valeur numérique au-dessus du rectangle
    ctx.font = '20px Arial';
    ctx.fillStyle = '#000';
    ctx.textAlign = 'center';
    ctx.fillText("Vitesse du vent : " + valmoy.toFixed(1) + " km/h", x + width / 2, y - 40);

    // Dessiner les graduations verticales (tous les 10)
    ctx.font = '14px Arial';
    ctx.fillStyle = '#333';
    ctx.textAlign = 'center';  // Centrer le texte sous les graduations
    for (let i = 0; i <= 15; i++) {  // 150 / 10 = 15 graduations
        let gradValue = min_value + (i * 10);  // Espacement de 10
        let gradX = x + (i * (width / 15));    // Position horizontale de chaque graduation
        let gradY = y + height;  // Position du trait inférieur du rectangle
        
        // Affichage du texte sous chaque graduation
        ctx.fillText(gradValue, gradX, gradY + 15);  // Le texte est placé 15px sous le bas du rectangle

        // Dessiner un petit trait vertical pour chaque graduation
        ctx.beginPath();
        ctx.moveTo(gradX, gradY);  // Position de la graduation sur la ligne inférieure du rectangle
        ctx.lineTo(gradX, gradY - 5);  // Traînée de graduation de 5px
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 0.75;
        ctx.stroke();
    }
}
