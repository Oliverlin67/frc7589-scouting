// Import the functions you need from the SDKs you need

import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore, enableIndexedDbPersistence, collection, query, doc, where, addDoc, setDoc, getDocs, deleteDoc, deleteField, Timestamp, disableNetwork, enableNetwork, getDoc } from "firebase/firestore";
import { getRemoteConfig, getValue, fetchAndActivate } from "firebase/remote-config";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, sendPasswordResetEmail } from "firebase/auth";

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

window.isOnline = () => {
    if('onLine' in navigator) {
        console.log(navigator.onLine);
        return navigator.onLine;
    } else {
        console.log("trying");
        (async () => {
            return axios.get('https://www.google.com').then(() => {
                return true;
            }).catch(e => {
                return false;
            });
        })();
    }
}

window.updateEleText = (id, text) => {
    document.getElementById(id).innerText = text;
}

window.updateEleHTML = (id, html) => {
    document.getElementById(id).innerHTML = html;
}

window.showPage = (name) => {
    if(last_page != name) document.getElementById(name).classList.replace("hidden", "box");
    if(last_page != null && last_page != name) document.getElementById(last_page).classList.replace("box", "hidden");
    last_page = name;
}

window.copyHTML = (target, source) => {
    document.getElementById(target).innerHTML = document.getElementById(source).innerHTML;
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

window.getRecord = async (uuid) => {
    showMessage("Fetching record...");
    const docSnap = await getDoc(doc(db, "records", uuid));
    if(docSnap.exists()) {
        return docSnap;
    } else {
        showMessage("Record no found");
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
            return null;
        }
    } else {
        return await getDocs(collection(db, "teams"));
    }
}

async function storeTeam(key, data, silent = false) {
    const online = await isOnline();
    if(!online) getTeamIndex();
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

async function storeRecord(key, data, silent = false) {
    const online = await isOnline();
    showMessage("Saving record...");
    if(!online) showTeam(data.team_number);

    setDoc(
        doc(db, "records", key),
        data,
        { merge: true }
    ).then(() => {
        if(!silent) showMessage("Record successfully store!");
        if(online) showTeam(data.team_number);
    }).catch((error) => {
        showMessage(`FAILED to store record(${error})`, true, 'error');
    });
}

// ----------------
// Utils

window.getRate = (data) => {
    var formula = getValue(remoteConfig, "formula").asString();
    var parameters = JSON.parse(getValue(remoteConfig, "parameters").asString());
    parameters.forEach((parameter) => {
        //try {
            if(typeof(data[parameter.alias]) === Boolean) {
                formula = formula.replaceAll(parameter.alias, data[parameter.alias] ? 1 : 0);
            } else if(data[parameter.alias] !== undefined) {
                    formula = formula.replaceAll(parameter.alias, data[parameter.alias]);
            } else if(parameter.alias.includes("Attempt") && parameter.alias.includes("Auto") && parameter.alias.includes("Teleop") && data[parameter.alias] == 0) {
                if(parameter.alias.includes("Attempt")) {
                    formula = formula.replaceAll(parameter.alias, "1");
                }
            } else {
                formula = formula.replaceAll(parameter.alias, "1");
            }
        //} catch(e) {
        //    alert("ERROR!");
        //    formula = formula.replaceAll(parameter.alias, "1");
        //}
    });
    console.log(formula);
    return eval(formula);
}

// ----------------

// Actions

window.getTeamIndex = () => {
    copyHTML("team-index", "loadingScreen");
    showPage("teamIndexScreen");
    if(tba_available()) {
        document.getElementById("tbaAddTeamBtn").classList.remove("hidden");
    }

    getTeams().then((teams) => {
        if(!teams.empty) {
            var html = "";
            teams.forEach(async (team) => {
                var teamData = team.data();
                var rate = 0;
                await getAllRecords(team.id).then((records) => {
                    records.forEach((record) => {
                        var recordData = record.data();
                        rate += getRate(recordData.parameters);
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
                            </div>`;
                });
                updateEleHTML("team-index", html);
            });
        } else {
            copyHTML("team-index", "noResultScreen");
        }
    });
}

window.showTeam = (number) => {
    document.getElementById('teamContainer').setAttribute('current', 'teamRecordList');
    document.getElementById('teamRecordList').classList.remove('hidden');
    document.getElementById('teamInfo').classList.add('hidden');
    document.querySelector('[page=teamRecordList]').classList.replace('border-b-0', 'border-b-2');
    document.querySelector('[page=teamInfo]').classList.replace('border-b-2', 'border-b-0');

    getTeams(number).then((team) => {
        (async () => {
            if(!team.empty) {
                var teamData = team.data();
                updateEleHTML("teamRecordList", "");
                showPage("teamViewScreen");
                updateEleText("teamID", teamData.info.team_number);
                updateEleText("teamName", teamData.info.nickname);
                updateEleText("teamRookieYear", teamData.info.rookie_year);
                document.getElementById('recordCreateBtn').setAttribute('onclick', `recordCreate('${number}')`);

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
                            offline: deleteField()
                        }).then(() => {
                            showMessage("Team info successfully updated!");
                            showTeam(number);
                        })
                        .catch((error) => {
                            console.error(error);
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
                    records.forEach((record) => {
                        var record_data = record.data();
                        htmlCode += `<div class="bg-blue-50 rounded-lg w-full p-3 lg:p-5 space-y-2 relative">
                            <div class="absolute top-2 right-2 flex items-center space-x-2">
                                <button class="w-5 h-5" onclick="deleteRecord('${record.id}', '${number}')">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                    </svg>
                                </button>
                                <button class="w-5 h-5" onclick="recordCreate('${number}', '${record.id}')">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                                    </svg>
                                </button>
                            </div>
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
                            htmlCode += `<li class="text-blue-800 space-x-1">${key}:<span class="font-bold">${record_data.parameters[key]}</span></li>`;
                        });
                        htmlCode += '</ul></div></div>';
                    });
                    updateEleHTML("teamRecordList", htmlCode);
                } else {
                    copyHTML("teamRecordList", "noResultScreen");
                }
            });
        })();
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

window.addTeam = () => {
    Swal.fire({
        title: 'Add Team',
        text: 'enter team number',
        input: 'number',
        inputAttributes: {
            autocapitalize: 'off'
        },
        showCancelButton: true,
        confirmButtonText: 'Search',
        showLoaderOnConfirm: true,
        preConfirm: (number) => {
            if('onLine' in navigator) {
                if(!navigator.onLine) {
                    return {
                        requireName: true,
                        number: number
                    };
                }
            }
            return axios.get("https://www.thebluealliance.com/api/v3/team/frc" + number, {
                        headers: {
                            "accept": "application/json",
                            "X-TBA-Auth-Key": getValue(remoteConfig, "tba_key").asString()
                        }
                    }).then(res => {
                        if(res.status == 200) {
                            return res.data;
                        } else {
                            Swal.showValidationMessage(
                                `Request failed`
                            );
                        }
                    }).catch(error => {
                        Swal.showValidationMessage(
                            `Request failed: ${error}`
                        );
                    });
        },
        allowOutsideClick: () => !Swal.isLoading()
    }).then((result) => {
        if (result.isConfirmed) {
            if(result.value.requireName) {
                Swal.fire({
                    title: 'Enter Team Name',
                    input: 'text',
                    inputAttributes: {
                        autocapitalize: 'off'
                    },
                    preConfirm: (input) => {
                        return input;
                    },
                    showCancelButton: true,
                    confirmButtonText: 'Add',
                    showLoaderOnConfirm: true,
                }).then((response) => {
                    if (response.isConfirmed) {
                        Swal.fire({
                            title: `Adding FRC # ${result.value.number}\n(aka "${response.value}") ?`,
                            showCancelButton: true,
                            confirmButtonText: 'Add',
                        }).then((action) => {
                            if(action.isConfirmed) storeTeam(result.value.number.toString(), {
                                info: {
                                    team_number: result.value.number.toString(),
                                    nickname: response.value,
                                },
                                rankingPoint: 0,
                                offline: true
                            });
                            getTeamIndex();
                        });
                    }
                });
            } else {
                Swal.fire({
                    title: `Adding FRC # ${result.value.team_number}\n(aka "${result.value.nickname}") ?`,
                    showCancelButton: true,
                    confirmButtonText: 'Add',
                }).then((response) => {
                    const awards = async () => {
                        const data =  await axios.get(`https://www.thebluealliance.com/api/v3/team/frc${result.value.team_number}/awards`, {
                                    headers: {
                                        "accept": "application/json",
                                        "X-TBA-Auth-Key": getValue(remoteConfig, "tba_key").asString()
                                    }
                                }).then(res => {
                                    console.table(res.data);
                                    if(res.status == 200) {
                                        return res.data;
                                    }
                                    return [];
                                }).catch(error => {
                                    console.log(error);
                                    return [];
                                });
                        return data;
                    };
                    awards().then(awards_result => {
                        var data = {
                            rankingPoint: 0,
                            info: result.value,
                            awards: awards_result
                        };
                        console.log(data);
                        if(response.isConfirmed) storeTeam(result.value.team_number.toString(), data);
                        getTeamIndex();
                    });
                });
            }
        }
    });
}

window.recordCreate = async (numbers = null, uuid = null) => {
    var data = {};
    if(uuid != null) {
        data = await getRecord(uuid);
        data =  data != null ? data.data().parameters : {};
    }
    
    if(numbers == null) {
        numbers = await Swal.fire({
                title: 'Start Record',
                text: 'enter team numbers(separate by comma)',
                input: 'text',
                inputAttributes: {
                    autocapitalize: 'off',
                    pattern: '^[0-9]{1,}(?:,[0-9]{1,})*$'
                },
                validationMessage: 'Please enter valid team numbers(Check if you leave blank there or use ZH comma)',
                confirmButtonText: 'Start',
                showCancelButton: 'Cancel'
            }).then((result) => {
                if(result.isConfirmed) {
                    return result.value;
                }
            });
        if(numbers === undefined) return;
    }
    var formHtml = "";
    var recordTabHtml = "";
    const teamNumbers = numbers.split(",");
    document.getElementById("recordTabContainer").setAttribute("current", teamNumbers[0]);
    teamNumbers.forEach((number) => {
        recordTabHtml += `<button class="flex-1 py-3 border-b-0 border-blue-500 text-blue-800 tab-button" team-number="${number}">
        # ${number}
        </button>`;
        formHtml += `<form class="space-y-4 px-4 py-5 sm:p-6 teamRecordForm hidden" team-number="${number}">
        <h1 class="text-lg lg:text-xl font-bold">Record of #${number}</h1>`;
        JSON.parse(getValue(remoteConfig, "parameters").asString()).forEach((parameter) => {
            switch(parameter.type) {
                case "textarea":
                    formHtml += `<div>
                            <label for="${number}-${parameter.alias}" class="block font-medium text-gray-700">${parameter.name}</label>
                            <div class="mt-1">
                                <textarea id="${number}-${parameter.alias}" name="${parameter.alias}" rows="5" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2" placeholder="${parameter.name}">${data[parameter.alias] !== undefined ? data[parameter.alias] : ""}</textarea>
                            </div>
                        </div>`;
                    break;
                case "checkbox":
                    formHtml += `<div>
                            <label for="${number}-${parameter.alias}" class="block font-medium text-gray-700 text-center">${parameter.name}</label>
                            <div class="mt-1">
                                <input id="${number}-${parameter.alias}" name="${parameter.alias}" class="mt-1 mx-auto block w-28 h-16 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2" ${data[parameter.alias] !== undefined ? (data[parameter.alias] == '1' ? "checked" : "") : ""} placeholder="${parameter.name}" type="${parameter.type}"/>
                            </div>
                        </div>`;
                    break;
                case "heading":
                    var sizes = [
                        "text-4xl",
                        "text-3xl",
                        "text-2xl",
                        "text-xl",
                        "text-lg",
                        "text-base"
                    ];
                    formHtml += `<div>
                            <div class="mt-1">
                                <h${parameter.size} class="${sizes[parameter.size-1]} font-bold">${parameter.name}</h${parameter.size}>
                            </div>
                        </div>`;
                    break;
                case "hr":
                    formHtml += `<`;
                    break;
                case "select":
                    var options = '';
                    parameter.options.forEach((option) => {
                        options += `<option value="${option.value}" ${data[parameter.alias] !== undefined ? (data[parameter.alias] == option.value ? "selected" : "") : ""}>${option.name}</option>`;
                    });
                    formHtml += `<div>
                            <div class="mt-1">
                                <label for="${number}-${parameter.alias}" class="block font-medium text-gray-700">${parameter.name}</label>
                                <select id="${number}-${parameter.alias}" name="${parameter.alias}" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2" placeholder="${parameter.name}">
                                <option value="" disabled>Select the "${parameter.name}"...</option>
                                ${options}
                                </select>
                            </div>
                        </div>`;
                    break;

                default:

                    if(parameter.type == "number") {
                        formHtml += `<div>
                            <label for="${number}-${parameter.alias}" class="block font-medium text-center text-gray-700">${parameter.name}</label>
                            <div class="mt-1 w-full flex items-center justify-around">
                                    <button 
                                        onclick="num_dec(\'${number}-${parameter.alias}\')"
                                        type="button"
                                        class="inline-flex justify-center rounded-md border-transparent bg-teal-600 py-3 px-6 text-4xl font-bold text-white shadow-sm hover:bg-teal-700 focus:outline-none border-teal-500 border-2 focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
                                    >-</button>
                                    <input id="${number}-${parameter.alias}" name="${parameter.alias}" class="mt-1 block rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm p-2" value="${data[parameter.alias] !== undefined ? data[parameter.alias] : (parameter.type == "number" ? 0 : '')}" placeholder="${parameter.name}" type="${parameter.type}"/>
                                    <button 
                                        onclick="num_inc(\'${number}-${parameter.alias}\')"
                                        type="button"
                                        class="inline-flex justify-center rounded-md border-transparent bg-teal-600 py-3 px-6 text-4xl font-bold text-white shadow-sm hover:bg-teal-700 focus:outline-none border-teal-500 border-2 focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
                                    >+</button>
                                </div>
                            </div>
                        </div>`;
                    } else {
                        formHtml += `<div>
                            <label for="${number}-${parameter.alias}" class="block font-medium text-gray-700">${parameter.name}</label>
                            <div class="mt-1">
                                <input id="${number}-${parameter.alias}" name="${parameter.alias}" class="mt-1 block rounded-md border-gray-300 shadow-sm w-full focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2" value="${data[parameter.alias] !== undefined ? data[parameter.alias] : (parameter.type == "number" ? 0 : '')}" placeholder="${parameter.name}" type="${parameter.type}"/>
                            </div>
                        </div>`;
                    }
            }
        });
        if(uuid != null) {
            formHtml += `<input id="${number}-uuid" value="${uuid}"  hidden disabled />`;
        }
        formHtml += "</form>";
    });
    updateEleHTML("recordTabContainer", recordTabHtml);
    updateEleHTML("form_content", formHtml);
    document.querySelector(`.tab-button[team-number="${document.getElementById("recordTabContainer").getAttribute("current")}"]`).classList.replace('border-b-0', 'border-b-2');
    document.querySelector(`.teamRecordForm[team-number="${document.getElementById("recordTabContainer").getAttribute("current")}"]`).classList.toggle('hidden');
    showPage("recordCreateScreen");
    
}

window.recordSave = () => {
    document.querySelectorAll('.teamRecordForm').forEach((el) => {
        var data = {
            team_number: el.getAttribute("team-number").toString(),
            parameters: {},
            timestamp: Timestamp.now(),
            userId: auth.currentUser.uid
        };

        JSON.parse(getValue(remoteConfig, 'parameters').asString()).forEach((parameter) => {
            if(parameter.type == 'number') {
                data['parameters'][parameter.alias] = Number(document.getElementById(`${data.team_number}-${parameter.alias}`).value);
            } else if(parameter.type == 'checkbox') {
                data['parameters'][parameter.alias] = document.getElementById(`${data.team_number}-${parameter.alias}`).checked ? 1 : 0;
            } else if(parameter.type != 'heading') {
                data['parameters'][parameter.alias] = document.getElementById(`${data.team_number}-${parameter.alias}`).value.replace(/\s+/g, "\\n");
            }
        });

        if(document.getElementById(`${data.team_number}-uuid`) != null) {
            storeRecord(document.getElementById(`${data.team_number}-uuid`).value, data);
        } else {
            storeRecord(_uuid(), data);
        }
    });
}

window.deleteRecord = async (key, team_number) => {
    const online = await isOnline();
    Swal.fire({
        icon: 'warning',
        title: `Delete Confirm`,
        text: `Delete Record '${key}'?`,
        confirmButtonText: 'Delete',
        showCancelButton: true
    }).then((result) => {
        if(result.isConfirmed) {
            showMessage("Deleting record...");
            if(!online) showTeam(team_number);
            deleteDoc(doc(db, "records", key))
                .then(() => {
                    showMessage("Record successfully deleted!");
                    if(online) showTeam(team_number);
                })
                .catch((error) => {
                    showMessage(`FAILED to delete record(${error})`, true, 'error');
                });
        }
    });
}

window.addTeamViaTBA = () => {
    if(!isOnline()) {
        Swal.fire({
            icon: "warning",
            title: "Internet Connection Required!",
            text: "Please connect to the Internet before using this function."
        });
        return;
    }
    (async () => {
        const inputOptions = axios.get(
            "https://www.thebluealliance.com/api/v3/team/frc7589/events/keys",
            {
                headers: {
                    "accept": "application/json",
                    "X-TBA-Auth-Key": getValue(remoteConfig, "tba_key").asString()
                }
            }).then(res => {
                if(res.status == 200) {
                    var result = {};
                    res.data.forEach((key) => {
                        result[key] = key;
                    });
                    return result;
                }
            }).catch(error => {
                Swal.showValidationMessage(
                    `Request failed: ${error}`
                );
            });

        Swal.fire({
            title: 'Choose the Event Key:',
            input: 'select',
            inputOptions: inputOptions,
            inputValue: getValue(remoteConfig, "eventKey").asString(),
            showCancelButton: true,
            confirmButtonText: 'Selete',
            showLoaderOnConfirm: true,
            preConfirm: (value) => {
                return axios.get("https://www.thebluealliance.com/api/v3/event/" + value + "/teams/keys", {
                    headers: {
                        "accept": "application/json",
                        "X-TBA-Auth-Key": getValue(remoteConfig, "tba_key").asString()
                    }
                }).then(res => {
                    if(res.status == 200) {
                        return res.data;
                    }
                }).catch(error => {
                    console.log(error.toJSON());
                });
            },
            customClass: {
                input: "px-3 py-2 bg-white border shadow-sm border-slate-300 placeholder-slate-400 disabled:bg-slate-50 disabled:text-slate-500 disabled:border-slate-200 focus:outline-none focus:border-sky-500 focus:ring-sky-500 rounded-md sm:text-sm focus:ring-1 invalid:border-pink-500 invalid:text-pink-600 focus:invalid:border-pink-500 focus:invalid:ring-pink-500 disabled:shadow-none"
            },
            allowOutsideClick: () => !Swal.isLoading()
        }).then((result) => {
            if(result.isConfirmed) {
                Swal.fire({
                    title: `Add ${result.value.length} teams include?`,
                    showCancelButton: true,
                    confirmButtonText: 'Add',
                    showLoaderOnConfirm: true,
                    preConfirm: async () => {
                        await result.value.forEach(async (team) => {

                                const info = await axios.get(`https://www.thebluealliance.com/api/v3/team/${team}`, {
                                                headers: {
                                                    "accept": "application/json",
                                                    "X-TBA-Auth-Key": getValue(remoteConfig, "tba_key").asString()
                                                }
                                            }).then(res => {
                                                console.table(res.data);
                                                if(res.status == 200) {
                                                    return res.data;
                                                }
                                                return [];
                                            }).catch(error => {
                                                console.log(error);
                                                return [];
                                            });
    
                                const awards = await axios.get(`https://www.thebluealliance.com/api/v3/team/${team}/awards`, {
                                                headers: {
                                                    "accept": "application/json",
                                                    "X-TBA-Auth-Key": getValue(remoteConfig, "tba_key").asString()
                                                }
                                            }).then(res => {
                                                console.table(res.data);
                                                if(res.status == 200) {
                                                    return res.data;
                                                }
                                                return [];
                                            }).catch(error => {
                                                console.log(error);
                                                return [];
                                            });
    
                                var data = {
                                    rankingPoint: 0,
                                    info: info,
                                    awards: awards
                                };
    
                                console.log(data);
    
                                storeTeam(info.team_number.toString(), data, true);
                            });
                        return true;
                    },
                    allowOutsideClick: () => !Swal.isLoading()
                }).then((result) => {
                    if(result.isConfirmed) getTeamIndex();
                });
            }
        });
    })();
}

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

window.num_dec = (id) => {
    var el = document.getElementById(id);
    if(Number(el.value) > 0) el.value = Number(el.value) - 1;
}

window.num_inc = (id) => {
    var el = document.getElementById(id);
    el.value = Number(el.value) + 1;
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

onAuthStateChanged(auth, async (user) => {
    if (user) {
        const uid = user.uid;
        getTeamIndex();
    } else {
        if(await userLogin()) {
            getTeamIndex();
        }
    }
});

document.getElementById('teamContainer').addEventListener('click', (e) => {
    if (e.target.classList.contains('tab-button')) {
        if(document.getElementById('teamContainer').getAttribute('current') != e.target.getAttribute('page')) {
            document.getElementById(document.getElementById('teamContainer').getAttribute('current')).classList.toggle('hidden');
            document.getElementById(e.target.getAttribute('page')).classList.toggle('hidden');
            e.target.classList.replace('border-b-0', 'border-b-2');
            document.querySelector(`[page=${document.getElementById('teamContainer').getAttribute('current')}]`).classList.replace('border-b-2', 'border-b-0');
            document.getElementById('teamContainer').setAttribute('current', e.target.getAttribute('page'));
        }
    }
});

document.getElementById('recordTabContainer').addEventListener('click', (e) => {
    if (e.target.classList.contains('tab-button')) {
        if(document.getElementById('recordTabContainer').getAttribute('current') != e.target.getAttribute('team-number')) {
            document.querySelector(`.teamRecordForm[team-number="${document.getElementById('recordTabContainer').getAttribute('current')}"]`).classList.toggle('hidden');
            document.querySelector(`.teamRecordForm[team-number="${e.target.getAttribute('team-number')}"]`).classList.toggle('hidden');
            e.target.classList.replace('border-b-0', 'border-b-2');
            document.querySelector(`.tab-button[team-number="${document.getElementById('recordTabContainer').getAttribute('current')}"]`).classList.replace('border-b-2', 'border-b-0');
            document.getElementById('recordTabContainer').setAttribute('current', e.target.getAttribute('team-number'));
        }
    }
});
