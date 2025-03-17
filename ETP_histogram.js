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
    const step = 0.04166; // 1 heure = 1/24 de jour
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
            labels: labels,
            datasets: [{
                label: 'ETP horaire sur les 24 dernières heures',
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
                        text: 'mm/h'  // Ajout de l’unité sur l’axe Y
                    }
                }
            }
        }
    });
}


async function fetchAndPlotHistogram(time, canvasId) {
    // Récupérer toutes les moyennes en parallèle pour optimiser la vitesse
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
    const labels = Array.from({ length: time * 24 }, (_, i) => -(time * 24 - 1 - i));

    // Tracer l'histogramme
    plotHistogram(hourlyMeansETP, labels, canvasId);
}


fetchAndPlotHistogram(1,'histogramETP')

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






