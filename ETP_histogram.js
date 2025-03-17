console.log("Debut du script");

async function fetchDataRes(param,period) { 
    const url = `http://145.239.199.14/cgi-bin/barthe/provide_data.py?param=${param}&period=${period}`;
    const response = await fetch(url);
    const jsonData = await response.json();
    return jsonData
}

async function fetchHourlyMeans(param, time) {
    // Initialisation d'un tableau pour stocker les moyennes horaires avec leurs heures respectives
    const moyennes = [];
    // Calcul du pas (step) en jours. On suppose que time est en jours.
    const step = 1 / 24; // 1 heure = 1/24 de jour
    // Initialisation de la période de départ (la période totale en jours est donnée par la variable 'time')
    let period = time; // La période de départ est définie par l'utilisateur (en jours)
    // Calcul du nombre d'heures dans la période définie par 'time' (en jours)
    const totalHours = time * 24; // Nombre total d'heures dans la période (jours * 24)
    // Boucle pour calculer les moyennes horaires, sur totalHours heures
    for (let i = 0; i < totalHours; i++) {
        // Appel de la fonction fetchDataRes pour obtenir les données avec la période actuelle
        const data = await fetchDataRes(param, period);
        // Extraction de la moyenne pour la période actuelle
        const currentMean = data[0].moyenne;
        const nextperiod = period - step
        const nextPeriodData = await fetchDataRes(param,nextperiod); // Récupère les données pour la période réduite d'une heure
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

// Fonction de tracé de l'histogramme avec Chart.js
function plotHistogram(data, labels, canvasId) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,  // Les heures comme labels (axe X)
            datasets: [{
                label: 'Histogramme des moyennes horaires',
                data: data,  // Les moyennes horaires comme données (axe Y)
                backgroundColor: 'rgba(75, 192, 192, 0.2)',  // Couleur de fond des barres
                borderColor: 'rgba(75, 192, 192, 1)',  // Couleur des bordures des barres
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true  // Commencer l'axe des Y à 0
                }
            }
        }
    });
}


async function fetchAndPlotHistogram(param, time, canvasId) {
    // Récupérer les moyennes horaires en attendant la réponse
    const hourlyMeans = await fetchHourlyMeans(param, time);

    // Générer les labels allant de -(time * 24 - 1) à 0
    const labels = Array.from({ length: time * 24 }, (_, i) => -(time * 24 - 1 - i));

    // Tracer l'histogramme
    plotHistogram(hourlyMeans, labels, canvasId);
}



fetchAndPlotHistogram(1,1,'histogramCanvas')

// fonction qui calcule l'ETP selon Penman-Monteith
function ETP(solar, temp, humidity, wind) {
    // Convertir la température en Kelvin
    const tempK = temp + 273.15;
    // Calculer la pression de vapeur saturante (e_s) en kPa
    const e_s = 0.6108 * Math.exp((17.27 * temp) / (temp + 237.3));
    // Calculer la pression de vapeur actuelle (e_a) en kPa
    const e_a = e_s * (humidity / 100);
    // Calculer le déficit de pression de vapeur (VPD) en kPa
    const VPD = e_s - e_a;

    // Calculer le rayonnement net (Rn) en MJ/m²/heure
    const Rn = 0.77 * solar;
    // Calculer la constante psychrométrique (gamma) en kPa/°C
    const gamma = 0.000665 * pressure;
    // Calculer la pente de la courbe de pression de vapeur (Delta) en kPa/°C
    const Delta = (4098 * e_s) / Math.pow((temp + 237.3), 2);
    // Convertir le vent en m/s
    const windms = wind/3.6
    // Calculer l'ETP en mm/jour
    const etp = (0.408 * Delta * (Rn - 0.34) + (900 / (tempK + 273)) * wind * VPD) / (Delta + gamma * (1 + 0.34 * wind));
    return etp;
}






