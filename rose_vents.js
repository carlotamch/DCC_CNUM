
async function fetchDataInst(param) { 
    const url = `http://145.239.199.14/cgi-bin/barthe/provide_single_json.py?param=${param}`;
    const response = await fetch(url);
    const jsonData = await response.json();
    return jsonData
}

async function displayValues() {
    const data =await fetchDataInst(7)
    const inst = data[0]._value

     // Appel de la fonction displaywind pour afficher le graphique avec les données récupérées
     drawwindrose(inst, "windrose"); // Passer les valeurs à displaywind
}

displayValues()

function drawwindrose(val, div) {
    const canvas = document.getElementById(div);
    const ctx = canvas.getContext('2d');
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = 150;
    const needleLength = radius * 0.7; // Longueur de la ligne
    const arrowSize = 10; // Taille de la pointe de la flèche

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#cccccc';
    ctx.stroke();

    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'];
    const angleStep = Math.PI / 4;

    for (let i = 0; i < directions.length; i++) {
        const angle = -Math.PI / 2 + angleStep * i;
        const x = centerX + Math.cos(angle) * (radius - 20);
        const y = centerY + Math.sin(angle) * (radius - 20);

        ctx.font = '14px Arial';
        ctx.fillStyle = '#000000';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(directions[i], x, y);
    }

    const adjustedVal = val + 180;
    const needleAngle = (-Math.PI / 2) + (adjustedVal * Math.PI / 180);

    const xEnd = centerX + Math.cos(needleAngle) * needleLength;
    const yEnd = centerY + Math.sin(needleAngle) * needleLength;

    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(xEnd, yEnd);
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#ff0000';
    ctx.stroke();

    // Dessiner la pointe de la flèche
    ctx.beginPath();
    ctx.moveTo(xEnd, yEnd);
    ctx.lineTo(xEnd - arrowSize * Math.cos(needleAngle - Math.PI / 6), yEnd - arrowSize * Math.sin(needleAngle - Math.PI / 6));
    ctx.lineTo(xEnd - arrowSize * Math.cos(needleAngle + Math.PI / 6), yEnd - arrowSize * Math.sin(needleAngle + Math.PI / 6));
    ctx.closePath();
    ctx.fillStyle = '#ff0000';
    ctx.fill();

    // Dessiner le petit cercle noir au-dessus de la flèche
    ctx.beginPath();
    ctx.arc(centerX, centerY, 10, 0, Math.PI * 2);
    ctx.fillStyle = '#000000';
    ctx.fill();
}








