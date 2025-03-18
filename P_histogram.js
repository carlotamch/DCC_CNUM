console.log("Debut du script");

async function fetchDataRes(param,period) { 
    const url = `http://145.239.199.14/cgi-bin/barthe/provide_data.py?param=${param}&period=${period}`;
    const response = await fetch(url);
    const jsonData = await response.json();
    return jsonData
}

async function fetchHourlySums(param, time) {
    // Initialisation d'un tableau pour stocker les moyennes horaires avec leurs heures respectives
    const cumuls = [];
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
        const currentSum = data[0].cumul;
        const nextperiod = period - step
        const nextPeriodData = await fetchDataRes(param,nextperiod); // Récupère les données pour la période réduite d'une heure
        const nextPeriodSum = nextPeriodData[0].cumul; // cumul pour la période réduite
        // Calcul de la moyenne horaire (en soustrayant la moyenne sur 23 heures de la moyenne sur la période entière)
        const hourlySum = currentSum-nextPeriodSum;
        // Ajout de l'objet contenant l'heure et la moyenne horaire calculée dans le tableau
        cumuls.push(hourlySum);
        // Réduction de la période pour l'itération suivante (réduction de la période de 1 heure)
        period -= step;
    }
    // Retourne le tableau des moyennes horaires avec leurs heures respectives
    return cumuls;
}

// Fonction de tracé de l'histogramme avec Chart.js
function plotHistogramP(data, labels, canvasId) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Précipitations sur les 24 dernières heures',
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


async function fetchAndPlotHistogramP(time, canvasId) {
    // Récupérer toutes les moyennes en parallèle pour optimiser la vitesse
    const hourlypluvio = await fetchHourlySums(8,time)


    // Générer les labels allant de -(time * 24 - 1) à 0
    const labels = Array.from({ length: time * 24 }, (_, i) => -(time * 24 - 1 - i));

    // Tracer l'histogramme
    plotHistogramP(hourlypluvio, labels, canvasId);
}


fetchAndPlotHistogramP(1,'histogramP')






