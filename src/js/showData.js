// Import the functions you need from the SDKs you need

import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore, enableIndexedDbPersistence, collection, query, doc, where, orderBy, setDoc, getDocs, Timestamp, disableNetwork, enableNetwork, getDoc } from "firebase/firestore";
import { getRemoteConfig, getValue, fetchAndActivate } from "firebase/remote-config";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, sendPasswordResetEmail } from "firebase/auth";
import { Chart } from 'chart.js/auto';
import Swal from "sweetalert2";

window.axios = require('axios');
window.Swal = require('sweetalert2');

window.showMessage = (title, top = false, type = 'info', after) => {

    let timerInterval;

    console.log(title);

    var bgColor, textColor;

    switch(type) {
        case 'info':
            bgColor = 'bg-slate-800';
            textColor = 'text-slate-50';
            break;
        case 'warning':
            bgColor = 'bg-amber-500';
            textColor = 'text-amber-100';
            break;
        case 'error':
            bgColor = 'bg-red-500';
            textColor = 'text-red-100';
            break;
    }

    Swal.fire({
        title: title,
        position: top ? 'top' : 'bottom',
        timer: 1500,
        timerProgressBar: true,
        willClose: () => {
            clearInterval(timerInterval);
            after
        },
        showClass: {
            popup: `
            animate__animated
            ${top ? 'animate__fadeInDown' : 'animate__fadeInUp'}
            animate__faster
            `
        },
        hideClass: {
            popup: `
            animate__animated
            ${top ? 'animate__fadeOutUp' : 'animate__fadeOutDown'}
            animate__faster
            `
        },
        customClass: {
            container: 'p-1.5',
            title: `p-2.5 ${textColor} text-base font-medium`,
            popup: `rounded-md ${bgColor}`
        },
        padding: '0',
        grow: 'row',
        showConfirmButton: false,
        showCloseButton: false,
        backdrop: false,
        heightAuto: false
    });
}

window._uuid = () => {
    var d = Date.now();
    if (typeof performance !== 'undefined' && typeof performance.now === 'function'){
        d += performance.now(); //use high-precision timer if available
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = (d + Math.random() * 16) % 16 | 0;
        d = Math.floor(d / 16);
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
};

var last_page;

window.isOnline = async () => {
    if('onLine' in navigator) {
        console.log(navigator.onLine);
        return navigator.onLine;
    } else {
        console.log("trying");
        return await axios.get('https://www.google.com').then(() => {
            return true;
        }).catch(e => {
            return false;
        });
    }
}

window.updateEleText = (id, text) => {
    window.document.getElementById(id).innerText = text;
}

window.updateEleHTML = (id, html) => {
    window.document.getElementById(id).innerHTML = html;
}

window.showPage = (name) => {
    if(last_page != name) window.document.getElementById(name).classList.replace("hidden", "box");
    if(last_page != null && last_page != name) window.document.getElementById(last_page).classList.replace("box", "hidden");
    last_page = name;
}

window.copyHTML = (target, source) => {
    window.document.getElementById(target).innerHTML = window.document.getElementById(source).innerHTML;
}

// Firebase

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyCQ5cg4VRFiVxeT6JQPKI1vd3kB938w_g0",
    authDomain: "frc-7589.firebaseapp.com",
    databaseURL: "https://frc-7589-default-rtdb.firebaseio.com",
    projectId: "frc-7589",
    storageBucket: "frc-7589.appspot.com",
    messagingSenderId: "283240547457",
    appId: "1:283240547457:web:ce55f744bc4b4d46653980",
    measurementId: "G-2EB11FYT18"
};
  
// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);
const remoteConfig = getRemoteConfig(app);
const auth = getAuth(app);

enableIndexedDbPersistence(db)
    .catch((err) => {
        console.log("DB Error: " + err);
    });

function tba_available() {
    return getValue(remoteConfig, "tba_key").asString() != null;
}

function fetchSettings(silent = false) {
    fetchAndActivate(remoteConfig)
        .then(() => {
            if(!silent) showMessage("Config Fetched");
        }).catch((err) => {
            showMessage("Config Error: " + err, true, 'error');
        });
}

async function signIn(email, password) {
    return await signInWithEmailAndPassword(auth, email, password)
        .then((user) => {
            return true;
        })
        .catch((err) => {
            return false;
        });
}

async function changeDBMode(online, silent = false) {
    if(online) {
        enableNetwork(db).then(() => {
            if(!silent) showMessage("mode: ONLINE");
        });
    } else {
        disableNetwork(db).then(() => {
            if(!silent) showMessage("mode: OFFLINE");
        });
    }
}

async function getAllRecords(number = null) {
    showMessage("Fetching records...");
    if(number != null) {
        return await getDocs(query(collection(db, "records"), where("team_number", "==", number)));
    } else {
        return await getDocs(collection(db, "records"));
    }
}

async function getTeams(number = null) {
    showMessage("Fetching teams...");
    if(number != null) {
        const docSnap = await getDoc(doc(db, "teams", number));
        if(docSnap.exists()) {
            return docSnap;
        } else {
            showMessage("Team no found");
        }
    } else {
        return await getDocs(collection(db, "teams"));
    }
}

async function storeTeam(key, data, silent = false) {
    const online = await isOnline();
    setDoc(
        doc(db, "teams", key),
        data,
        { merge: true }
    ).then(() => {
        if(!silent) showMessage("Team successfully store!");
    }).catch((error) => {
        showMessage(`FAILED to store team(${error})`, true, 'error');
    });
}

// ----------------
// Utils

window.getRate = (data) => {
    var formula = getValue(remoteConfig, "formula").asString();
    var parameters = JSON.parse(getValue(remoteConfig, "parameters").asString());
    parameters.forEach((parameter) => {
        try {
            if(typeof data[parameter.alias] === "boolean") {
                formula = formula.replaceAll(parameter.alias, data[parameter.alias] ? 1 : 0);
            } else if(data[parameter.alias] !== undefined && !parameters.contains("Attempts")) {
                formula = formula.replaceAll(parameter.alias, data[parameter.alias]);
            } else {
                formula = formula.replaceAll(parameter.alias, "1");
            }
        } catch(e) {
            formula = formula.replaceAll(parameter.alias, "1");
        }
    });
    return eval(formula);
}

// ----------------

// Actions

const allTeamChart = new Chart(document.getElementById('allTeamChart'), {
    type: 'bar',
    options: {
        indexAxis: 'y',
        scales: {
            x: {
                beginAtZero: true
            }
        },
        elements: {
            bar: {
                borderWidth: 2,
            }
        },
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'right',
            },
        }
    }
});

const bgColors = [
    "#36a2eb",
    "#ff6383",
    "#4cbfc0",
    "#fe9e40",
    "#9966ff",
    "#ffcd57",
    "#c8cbce",
    "#8e8466",
    "#17c91f",
    "#4456e8",
    "#a02964",
    "#5c6912",
    "#c7c8e9"
];

/*
var allTeamChartData = {
    labels: [],
    datasets: {}
};
*/

const chartOrderBySelect = document.getElementById("chartOrderBy");

var sortingData = [];

var allTeamChartData = {
    labels: [],
    datasets: [
        {
            label: "Ranking Point(Total)",
            alias: "rankingPoint",
            data: [],
            backgroundColor: bgColors[0],
            borderColor: bgColors[0]
        },
        {
            label: "Rate(Average)",
            alias: "rate",
            data: [],
            backgroundColor: bgColors[1],
            borderColor: bgColors[1]
        }
    ]
};

sortingData.push = async function() {
    await Array.prototype.push.apply(this, arguments)
    await sortingData.sort((a, b) => {
        return b[chartOrderBySelect.value]-a[chartOrderBySelect.value];
    });
    return true;
}

function updateTeamChart() {
    for(const key in Object.keys(allTeamChartData.datasets)) allTeamChartData.datasets[key].data = [];
    allTeamChartData.labels = [];

    sortingData.forEach((_data) => {
        Object.keys(_data).forEach((key) => {
            if(key == "teamNumber") {
                if(!allTeamChartData.labels.includes(_data[key])) allTeamChartData.labels.push(_data[key]);
                return;
            }
            const index = allTeamChartData.datasets.findIndex(obj => obj.alias == key);
            if(index != -1) allTeamChartData.datasets[index].data.push(_data[key]);
        });
    });

    console.log(allTeamChartData);
    allTeamChart.data = allTeamChartData;
    allTeamChart.update();
}

window.getTeamIndex = () => {
    copyHTML("team-index", "loadingScreen");
    showPage("teamIndexScreen");

    getTeams().then((teams) => {
        if(!teams.empty) {
            var html = "";
            allTeamChartData = {
                labels: [],
                datasets: [
                    {
                        label: "Ranking Point(Total)",
                        alias: "rankingPoint",
                        data: [],
                        backgroundColor: bgColors[0],
                        borderColor: bgColors[0]
                    },
                    {
                        label: "Rate(Average)",
                        alias: "rate",
                        data: [],
                        backgroundColor: bgColors[1],
                        borderColor: bgColors[1]
                    }
                ]
            };
            var parameters = JSON.parse(getValue(remoteConfig, "parameters").asString());
            var i = 2;
            Object.keys(parameters).forEach((key) => {
                if(i >= bgColors.length) {
                    i = 0;
                }
                if(parameters[key].type != "number") return;
                if(parameters[key].alias != "rankingPoint") {
                    allTeamChartData.datasets.push({
                        label: parameters[key].name + (parameters[key].alias != "rankingPoint" ? "(Average)" : "(Total)"),
                        alias: parameters[key].alias,
                        data: [],
                        backgroundColor: bgColors[i],
                        borderColor: bgColors[i]
                    });
                }
                if(parameters[key].alias == "rankingPoint") return;
                chartOrderBySelect.innerHTML += `<option value="${parameters[key].alias}">${parameters[key].name + "(Average)"}</option>`;
                i++;
            });
            teams.forEach(async (team) => {
                var teamData = team.data();
                var rate = 0;

                var _data = {
                    teamNumber: team.id
                };
                await getAllRecords(team.id).then((records) => {
                    records.forEach(function (record) {
                        var recordData = record.data();
                        rate += getRate(recordData.parameters);
                        Object.keys(recordData.parameters).forEach((key) => {
                            if(typeof recordData.parameters[key] !== "number") return;
                            if(!(key in _data)) _data[key] = 0;
                            _data[key] += recordData.parameters[key];
                        });
                    });
                    html += `<div class="bg-blue-100 rounded-lg w-full p-3 lg:p-5 space-y-3" onclick="showTeam('${team.id}')">
                                <div>
                                    <h1 class="text-xl xl:text-2xl">Team #${teamData.info.team_number}</h1>
                                    <h2 class="xl:text-lg">${teamData.info.nickname}</h2>
                                </div>
                                <div class="flex items-center justify-between space-x-2">
                                    <div class="flex-1 bg-blue-200 rounded-lg flex flex-col p-4">
                                        <h3 class="text-lg lg:text-xl flex space-x-1.5 items-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
                                                <path stroke-linecap="round" stroke-linejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                                            </svg>
                                            <span>Rate:</span>
                                        </h3>
                                        <p class="text-4xl font-bold text-center">${Math.round(rate/records.size*100)/100}</p></div>
                                        <div class="flex-1 bg-blue-200 rounded-lg flex flex-col p-4">
                                            <h3 class="text-lg lg:text-xl flex space-x-1.5 items-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
                                                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                                            </svg>
                                            <span>Records:</span>
                                        </h3>
                                        <p class="text-4xl font-bold text-center">${records.size}</p>
                                    </div>
                                </div>
                                <button 
                                    class="inline-flex justify-center items-center space-x-1.5 rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                                    onclick="exportExcel('${team.id}')">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4 hidden md:block">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                                    </svg>                                                        
                                    <span>Export</span>
                                </button>
                            </div>`;
                    Object.keys(_data).forEach((k) => {
                        if(k == "rankingPoint" || k == "teamNumber") return;
                        _data[k] /= records.size;
                    });
                });
                if(Object.keys(_data).length > 1) sortingData.push(_data);
                updateEleHTML("team-index", html);
                //allTeamChart.data = data;
                //allTeamChart.update();
            });
        } else {
            copyHTML("team-index", "noResultScreen");
        }
    });
}

const perRecordChart = new Chart(document.getElementById('perTeamChart'), {
    type: 'bar',
    options: {
        scales: {
            y: {
                beginAtZero: true
            }
        }
    }
});

window.showTeam = (number) => {
    window.document.getElementById('teamContainer').setAttribute('current', 'teamRecordTable');
    window.document.getElementById('teamRecordTable').classList.remove('hidden');
    window.document.getElementById('teamInfo').classList.add('hidden');
    window.document.getElementById('teamCharts').classList.add('hidden');
    window.document.querySelector('[page=teamRecordTable]').classList.replace('border-b-0', 'border-b-2');
    window.document.querySelector('[page=teamInfo]').classList.replace('border-b-2', 'border-b-0');
    window.document.querySelector('[page=teamCharts]').classList.replace('border-b-2', 'border-b-0');

    getTeams(number).then((team) => {
        (async () => {
            if(!team.empty) {
                var teamData = team.data();
                updateEleHTML("teamRecordTable", "");
                showPage("teamViewScreen");
                updateEleText("teamID", teamData.info.team_number);
                updateEleText("teamName", teamData.info.nickname);
                updateEleText("teamRookieYear", teamData.info.rookie_year);

                if('onLine' in navigator && teamData.offline) {
                    if(navigator.onLine) {
                        const info = await axios.get(`https://www.thebluealliance.com/api/v3/team/frc${number}`, {
                                                    headers: {
                                                        "accept": "application/json",
                                                        "X-TBA-Auth-Key": getValue(remoteConfig, "tba_key").asString()
                                                    }
                                                }).then(res => {
                                                    if(res.status == 200) {
                                                        return res.data;
                                                    }
                                                }).catch(error => {
                                                    showMessage("FAILED to fetch team info", true, 'warning');
                                                });
                        const awards = await axios.get(`https://www.thebluealliance.com/api/v3/team/frc${number}/awards`, {
                                                    headers: {
                                                        "accept": "application/json",
                                                        "X-TBA-Auth-Key": getValue(remoteConfig, "tba_key").asString()
                                                    }
                                                }).then(res => {
                                                    if(res.status == 200) {
                                                        return res.data;
                                                    }
                                                }).catch(error => {
                                                    showMessage("FAILED to fetch team info", true, 'warning');
                                                });
                        storeTeam(number, {
                            rankingPoint: 0,
                            info: info,
                            awards: awards,
                            offline: firebase.firestore.FieldValue.delete()
                        }).then(() => {
                            showMessage("Team info successfully updated!");
                            showTeam(number);
                        })
                        .catch((error) => {
                            showMessage("FAILED to update team info", true, 'error');
                        });
                    }
                }

                var html = "<h3>Awards</h3><ol>";

                if(teamData.awards !== undefined) {
                    teamData.awards.forEach((award) => {
                        html += "<li><ul>";
                        Object.keys(award).forEach((key) => {
                            if(typeof award[key] === "object") return;
                            html += '<li>' + key + ': ' + award[key] + '</li>';
                        });
                        html += "</ul></li>";
                    });
                }
                html += "</ol><h3>About</h3><ul>";
                if(typeof teamData.info !== undefined) {
                    Object.keys(teamData.info).forEach((key) => {
                        if(key == "key" || key == "nickname" || key == "team_number" || teamData.info[key] == null) return;
                        html += '<li>' + key + ': ' + (key == "website" ? '<a href="' + teamData.info[key] + '">' + teamData.info[key] + '</a>' : teamData.info[key] ) + '</li>';
                    });
                }
                html += "</ul>";
                updateEleHTML("teamInfo", html);
            }
            getAllRecords(number).then((records) => {
                if(!records.empty) {
                    var htmlCode = "";
                    /*
                    function getKeyByValue(object, value) {
                        return Object.keys(object).find(key => object[key] === value);
                    }
                    */
                    var data = {
                        labels: [],
                        datasets: []
                    };
                    var parameters = JSON.parse(getValue(remoteConfig, "parameters").asString());
                    Object.keys(parameters).forEach((key) => {
                        if(parameters[key].type != "number") return;
                        data.datasets.push({
                            label: parameters[key].name,
                            alias: parameters[key].alias,
                            data: [],
                            borderWidth: 1
                        });
                    });
                    var i = 0;
                    records.forEach((record) => {
                        data.labels.push(record.id);

                        var record_data = record.data();
                        htmlCode += `<div class="bg-blue-50 rounded-lg w-full p-3 lg:p-5 space-y-2 relative">
                            <div>
                                <h1 class="text-lg flex items-center space-x-1">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
                                    </svg>
                                    <span>${record.id}</span>
                                </h1>
                                <h2 class="text-sm flex items-center space-x-1">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span>${moment(new Date(record_data.timestamp.seconds*1000)).format('YYYY/MM/DD, HH:mm:ss')}</span>
                                </h2>
                            </div>
                            <div class="prose w-full">
                                <ul>`;
                        Object.keys(record_data.parameters).forEach((key) => {
                            const index = data.datasets.findIndex(obj => obj.alias == key);
                            if(index != -1) data.datasets[index].data.push(record_data.parameters[key]);
                            htmlCode += `<li class="text-blue-800 space-x-1">${key}:<span class="font-bold">${record_data.parameters[key]}</span></li>`;
                        });
                        htmlCode += '</ul></div></div>';
                        
                        i++;
                    });
                    perRecordChart.data = data;
                    perRecordChart.update();
                    updateEleHTML("teamRecordTable", htmlCode);
                } else {
                    perRecordChart.clear();
                    copyHTML("teamRecordTable", "noResultScreen");
                }
            });
        })();
    });
}

const flatten = (data) => {
    const result = {};
    const isEmpty = (x) => Object.keys(x).length === 0;
    const recurse = (cur, prop) => {
        if (Object(cur) !== cur) {
            result[prop] = cur;
        } else if (Array.isArray(cur)) {
            const length = cur.length;
            for (let i = 0; i < length; i++) {
                recurse(cur[i], `${prop}[${i}]`);
            }
            if (length === 0) {
                result[prop] = [];
            }
        } else {
            if (!isEmpty(cur)) {
                Object.keys(cur).forEach((key) =>
                    recurse(cur[key], prop ? `${key}` : key)
                );
            } else {
                result[prop] = {};
            }
        }
    };
    recurse(data, "");
    return result;
};

async function getArr(teamNumbers) {
    var all_team_data = [];
    var new_json = {};

    for (const teamNumber of teamNumbers) {
        all_team_data[teamNumber] = {
            "# Number": teamNumber
        };
        const records = await getAllRecords(teamNumber);
        records.forEach((record) => {
            var _json = {
                uuid: record.id
            };
            const record_parameters = flatten(record.data().parameters);
            Object.keys(record_parameters).forEach((key) => {
                _json[key] = record_parameters[key];
            })
            if(!(record.data().team_number in new_json)) {
                new_json[record.data().team_number] = [];
            }
            new_json[record.data().team_number].push(_json);
        });
    }
    return {
        all_team_data: all_team_data, 
        new_json: new_json
    };
}

window.exportExcel = async (numbers = "") => {
    const wb = XLSX.utils.book_new();
    var ws;

    if(numbers != "") {
        const teamNumbers = numbers.split(",");
        var labels = {};
        var all_team_data = [];
        var new_json = {};
        var parameters = JSON.parse(getValue(remoteConfig, "parameters").asString());
        Object.keys(parameters).forEach((key) => {
            if(parameters[key].type != "number") return;
            labels[parameters[key].alias] = {
                name: parameters[key].name,
                average: parameters[key].alias != "rankingPoint"
            };
            labels[parameters[key].name] = {
                alias: parameters[key].name,
                average: parameters[key].alias != "rankingPoint"
            };
        });
        const res =  await getArr(teamNumbers);
        all_team_data = res.all_team_data;
        new_json = res.new_json;

        Object.keys(new_json).forEach((teamKey) => {
            new_json[teamKey].forEach((record) => {
                Object.keys(record).forEach((recordKey) => {
                    if(recordKey in labels) {
                        if(!(labels[recordKey].name in all_team_data[teamKey])) {
                            all_team_data[teamKey][labels[recordKey].name] = 0;
                        }
                        all_team_data[teamKey][labels[recordKey].name] += record[recordKey];
                    }
                });
            });
            all_team_data.forEach((team) => {
                Object.keys(team).forEach((all_team_data_team_key) => {
                    if(all_team_data_team_key != "# Number" && labels[all_team_data_team_key].average) {
                        team[all_team_data_team_key] /= new_json[teamKey].length;
                    }
                });
            });
            ws = XLSX.utils.json_to_sheet(new_json[teamKey]);
            XLSX.utils.book_append_sheet(wb, ws, `team #${teamKey}`);
        });
        var all_team_data_ws_arr = [];
        all_team_data.forEach((team) => {
            if(Object.keys(team).length != 1) all_team_data_ws_arr.push(team);
        })
        ws = XLSX.utils.json_to_sheet(all_team_data_ws_arr);
        XLSX.utils.book_append_sheet(wb, ws, `All Team`);
        XLSX.writeFile(wb, 'scouting-export.xlsx');
    } else {
        const records = await getAllRecords(null);
        var labels = {};
        var all_team_data = [];
        var new_json = {};
        var parameters = JSON.parse(getValue(remoteConfig, "parameters").asString());
        Object.keys(parameters).forEach((key) => {
            if(parameters[key].type != "number") return;
            labels[parameters[key].alias] = {
                name: parameters[key].name,
                average: parameters[key].alias != "rankingPoint"
            };
            labels[parameters[key].name] = {
                alias: parameters[key].name,
                average: parameters[key].alias != "rankingPoint"
            };
        });
        records.forEach((record) => {
            var _json = {
                uuid: record.id
            };
            const record_parameters = flatten(record.data().parameters);
            Object.keys(record_parameters).forEach((key) => {
                _json[key] = record_parameters[key];
            })
            if(!(record.data().team_number in new_json)) {
                new_json[record.data().team_number] = [];
            }
            new_json[record.data().team_number].push(_json);
        });
        getTeams().then(async (teams) => {
            await teams.forEach((team) => {
                all_team_data[team.id] = {
                    "# Number": team.id
                };
            });
            await Object.keys(new_json).forEach((teamKey) => {
                (async () => {
                    await new_json[teamKey].forEach((record) => {
                        Object.keys(record).forEach((recordKey) => {
                            if(recordKey in labels) {
                                if(!(labels[recordKey].name in all_team_data[teamKey])) {
                                    all_team_data[teamKey][labels[recordKey].name] = 0;
                                }
                                all_team_data[teamKey][labels[recordKey].name] += record[recordKey];
                            }
                        });
                    });
                    await all_team_data.forEach((team) => {
                        Object.keys(team).forEach((all_team_data_team_key) => {
                            if(all_team_data_team_key != "# Number" && labels[all_team_data_team_key].average) {
                                team[all_team_data_team_key] /= new_json[teamKey].length;
                            }
                        });
                    });
                })();
                ws = XLSX.utils.json_to_sheet(new_json[teamKey]);
                XLSX.utils.book_append_sheet(wb, ws, `team #${teamKey}`);
            });
            var all_team_data_ws_arr = [];
            all_team_data.forEach((team) => {
                if(Object.keys(team).length != 1) all_team_data_ws_arr.push(team);
            })
            ws = XLSX.utils.json_to_sheet(all_team_data_ws_arr);
            XLSX.utils.book_append_sheet(wb, ws, `All Team`);
            XLSX.writeFile(wb, 'scouting-export.xlsx');
        });
    }
}

window.selectedExportExcel = async () => {
    const numbers = await Swal.fire({
        title: 'Export Data via Team',
        text: 'enter team numbers(separate by comma)',
        input: 'text',
        inputAttributes: {
            autocapitalize: 'off',
            pattern: '^[0-9]{1,}(?:,[0-9]{1,})*$'
        },
        validationMessage: 'Please enter valid team numbers(Check if you leave blank there or use ZH comma)',
        confirmButtonText: 'Export',
        showCancelButton: 'Cancel'
    }).then((result) => {
        if(result.isConfirmed) {
            return result.value;
        }
    });
    if(numbers === undefined) return;
    exportExcel(numbers);
};

window.searchTeam = async () => {
    const number = await Swal.fire({
        title: 'Enter Team Number',
        input: 'number',
        inputAttributes: {
            autocapitalize: 'off'
        },
        confirmButtonText: 'Search',
        showCancelButton: true
    }).then((result) => {
        if(result.isConfirmed) {
            showTeam(result.value);
        }
    });
}

window.sendPassswordReset = async () => {
    await Swal.fire({
        title: 'Forgot Password',
        html: `<input type="text" id="email" class="swal2-input w-7/8" placeholder="Email">
        <button class="text-blue-700 mt-4 text-sm" onclick="userLogin()">Login?</button>`,
        confirmButtonText: 'Send email',
        focusConfirm: false,
        showLoaderOnConfirm: true,
        preConfirm: async () => {
            const email = Swal.getPopup().querySelector('#email').value;

            if (!email) {
                Swal.showValidationMessage(`Please enter your email`);
            }

            return await sendPasswordResetEmail(auth, email)
                .then(() => {
                    return true;
                })
                .catch((error) => {
                    var errorCode = error.code;
                    var errorMessage = error.message;
                    Swal.showValidationMessage(`Wrong Email`);
                });
        },
        showClass: {
            popup: `
            animate__animated
            animate__fadeInUp
            animate__faster
            `
        },
        hideClass: {
            popup: `
            animate__animated
            animate__fadeOutDown
            animate__faster
            `
        },
        customClass: {
            container: 'p-1.5',
            htmlContainer: 'm-0 max-w-full flex flex-col spacep-y-2',
            popup: 'max-w-lg w-full'
        },
        allowOutsideClick: false
    }).then((result) => {
        showMessage("Password rest email Sent!");
        setTimeout(() => {
            userLogin();
        }, 1500);
    });
}

window.userLogin = async () => {
    await Swal.fire({
        title: 'Account Login',
        html: `<input type="text" id="email" class="swal2-input w-7/8" placeholder="Email">
        <input type="password" id="password" class="swal2-input w-7/8" placeholder="Password">
        <button class="text-blue-700 mt-4 text-sm" onclick="sendPassswordReset()">Forget Password?</button>`,
        confirmButtonText: 'Login',
        focusConfirm: false,
        showLoaderOnConfirm: true,
        preConfirm: async () => {
            const email = Swal.getPopup().querySelector('#email').value;
            const password = Swal.getPopup().querySelector('#password').value;

            if (!email || !password) {
                Swal.showValidationMessage(`Please enter email and password`);
            }

            if(await signIn(email, password)) return true;
            else Swal.showValidationMessage(`Username or Password Not Correct!`);
        },
        showClass: {
            popup: `
            animate__animated
            animate__fadeInUp
            animate__faster
            `
        },
        hideClass: {
            popup: `
            animate__animated
            animate__fadeOutDown
            animate__faster
            `
        },
        customClass: {
            container: 'p-1.5',
            htmlContainer: 'm-0 max-w-full flex flex-col spacep-y-2',
            popup: 'max-w-lg'
        },
        allowOutsideClick: false
    }).then((result) => {
        showMessage("Login Successful");
    });

    return true;
}

// Event Listener

window.addEventListener('load', async (event) => {
    if('onLine' in window.navigator) {
        changeDBMode(window.navigator.onLine, true);
        if(window.navigator.onLine) {
            fetchSettings(true);
        }
    }
});

window.addEventListener('offline', () => { 
    changeDBMode(false);
});

window.addEventListener('online', () => { 
    changeDBMode(true);
    fetchSettings();
});

onAuthStateChanged(auth, (user) => {
    if (user) {
        const uid = user.uid;
        getTeamIndex();
    } else {
        userLogin();
    }
});

document.getElementById('teamContainer').addEventListener('click', (e) => {
    if (e.target.classList.contains('tab-button')) {
        if(document.getElementById('teamContainer').getAttribute('current') != e.target.getAttribute('page')) {
            window.document.getElementById(document.getElementById('teamContainer').getAttribute('current')).classList.toggle('hidden');
            window.document.getElementById(e.target.getAttribute('page')).classList.toggle('hidden');
            e.target.classList.replace('border-b-0', 'border-b-2');
            window.document.querySelector(`[page=${document.getElementById('teamContainer').getAttribute('current')}]`).classList.replace('border-b-2', 'border-b-0');
            window.document.getElementById('teamContainer').setAttribute('current', e.target.getAttribute('page'));
        }
    }
});

chartOrderBySelect.addEventListener('change', async () => {
    await sortingData.sort((a, b) => {
        return b[chartOrderBySelect.value]-a[chartOrderBySelect.value];
    });
    updateTeamChart();
});
