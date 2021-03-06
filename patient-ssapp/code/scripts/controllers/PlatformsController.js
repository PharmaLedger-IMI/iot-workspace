import InformationRequestService from "../services/InformationRequestService.js";
import DPermissionService from "../services/DPermissionService.js";
import AvailableStudiesToParticipateService from "../services/AvailableStudiesToParticipateService.js";
import {consentModelHL7} from "../models/HL7/ConsentModel.js"
import EconsentStatusService from "../services/EconsentStatusService.js"
import CommunicationService from "../services/CommunicationService.js";
const {WebcController} = WebCardinal.controllers;


const ViewModel = {
    notification: ""
}


export default class PlatformsController extends WebcController {
    constructor(...props) {
        super(...props);

        this.model = ViewModel;

        this._attachHandlerGoBack();
        this._attachHandlerGoToMyNotifications();
        this._attachHandlerMyStudies();
        this._attachHandlerParticipate();

        if (this.getState()){
            let receivedState = this.getState();
            console.log("Received State: " + JSON.stringify(receivedState, null, 4));
            this.model.ssi = receivedState.ssi
            this.model.dssi = receivedState.dssi;
            this.model.cssi = receivedState.cssi;

            this.model.notification = "There is a new request, Please review your notifications."
            if (this.model.ssi == null){
                this.model.notification = ""
            }
            this.model.dssi = receivedState.dssi;
        }


        // HELPER FUNCTIONS FOR DATA MATCHMAKING AND DCONSENT GENERATION
        this.InformationRequestService = new InformationRequestService(this.DSUStorage);
        this.DPermissionService = new DPermissionService(this.DSUStorage);
        this.AvailableStudiesToParticipateService = new AvailableStudiesToParticipateService(this.DSUStorage);
        this.EconsentStatusService = new EconsentStatusService(this.DSUStorage);


        //List all information Requests
        // this.InformationRequestService.getInformationRequests((err, data) => {
        //     let all_information_requests;
        //     if (err) {
        //         return console.log(err);
        //     }
        //     all_information_requests = data;
        //     console.log("All information Requests are: " + (all_information_requests.length));
        //     //console.log(JSON.stringify(all_information_requests[all_information_requests.length-1], null, 4 ));
        // });


        // Mount Specific Information Request
        // if (!this._isBlank(this.model.ssi)){
        //     let mounted_information_request;
        //     this.InformationRequestService.mount(this.model.ssi, (err, data) => {
        //         if (err) {
        //             return console.log(err);
        //         }
        //         mounted_information_request = data;
        //         //console.log(JSON.stringify(mounted_information_request, null, 4 ));
        //     });
        // }


        //List all the D.Permissions
        // this.DPermissionService.getDPermissions((err, data) => {
        //     if (err) {
        //         return console.log(err);
        //     }
        //     //console.log(JSON.stringify(data, null, 4));
        //     //console.log("Total D Permissions are: " + (data.length));
        // });


        // Mount Specific D Permission with given keySSI
        // if (!this._isBlank(this.model.dssi)){
        //     //console.log("Trying to mount this D Permission: " + this.model.dssi);
        //
        //     this.DPermissionService.mount(this.model.dssi, (err, data) => {
        //         if (err) {
        //             return console.log(err);
        //         }
        //         // console.log("This D Permission is: ");
        //         // console.log(JSON.stringify(data, null, 4));
        //     });
        // }

        // Generate study to participate according to the Information Request
        //Save Sample Study
        // let sampleStudy = {
        //     study: "Study with date time: " + new Date().toString()
        // }
        // this.AvailableStudiesToParticipateService.saveStudy(sampleStudy, (err, data) => {
        //     if (err) {
        //         return console.log(err);
        //     }
        //     //console.log("Sample Study saved with keySSI " + data.keySSI)
        //     this.model.studyssi = data.KeySSI;
        // });

        //Mount the last or a specific consent with given ssi
        // console.log("Trying to mount this Consent: " + this.model.cssi);
        // this.EconsentStatusService.mount(this.model.cssi,  (err, data) => {
        //     if (err) {
        //         return console.log(err);
        //     }
        //     // console.log("This E Consent is: ");
        //     // console.log(JSON.stringify(data, null, 4));
        //     let e_consent = data;
        // });

        //List all the eConsents
        // this.EconsentStatusService.getConsents((err, data) => {
        //     if (err) {
        //         return console.log(err);
        //     }
        //     //console.log("Total consents are: " + (data.length));
        //
        // });

        // F-M3-2F Data Match Making



        // F-M3-6F dynamic Permissioning using eConsent UC

        this.model.dpermission_found = false;
        this.model.econsent_found = false;

        this.DPermissionService.getDPermissions((err, data) => {
            if (err) {
                return console.log(err);
            }
            //console.log(JSON.stringify(data, null, 4));
            console.log("Total D Permissions are: " + (data.length));
            for (let key in data){
                if(data[key].ConsentStatus.value === "active"){
                    console.log("DPermission is ACTIVE, check other filters");
                    let not_revoked = true;
                    if (not_revoked) {
                        let DPermissionObject = data[key];
                        console.log("D Permission found and ......")
                        // Send DSU or Do something else
                        this.model.dpermission_found = true;
                        break;
                    }
                    else{
                        console.log("D Permission cannot be generated, it has been revoked, rejected!");
                    }
                }
            }
            if (this.model.dpermission_found === false){
                this.EconsentStatusService.getConsents((err, data) => {
                    if (err) {
                        return console.log(err);
                    }
                    console.log("Total consents are: " + (data.length));
                    for (let key in data) {
                        if(data[key].ConsentStatus.value === "active"){
                            let DPermissionObject = data[key];
                            // Add metadata to the new D Permission object
                            DPermissionObject.ConsentStatus.value = "New Generated Automatically from EConsent";
                            DPermissionObject.Metadata = "metadata";
                            DPermissionObject.Revoked = "no";
                            // optional?? send to researcher ?? ACCEPT SEND DSU
                            this.DPermissionService.saveDPermission(DPermissionObject, (err, data) => {
                                if (err) {
                                    return console.log(err);
                                }
                                console.log("New Dynamic Automatic Permission Object saved with keySSI " + data.keySSI);
                                //console.log(JSON.stringify(data, null, 4));
                            });
                            this.model.econsent_found = true;
                            break;
                        }
                    }
                    if (this.model.econsent_found === false){
                        let answer = window.confirm("E Consent not found. Do you agree to donate/share this content?");
                        if (answer) {
                            console.log("USER DOES AGREE")

                            let DPermissionObject = JSON.parse(JSON.stringify(consentModelHL7));
                            // Add metadata to the new D Permission object
                            DPermissionObject.ConsentStatus.value = "active";
                            DPermissionObject.Metadata = "metadata";
                            DPermissionObject.Revoked = "no";
                            // optional?? send to researcher ?? ACCEPT SEND DSU
                            this.DPermissionService.saveDPermission(DPermissionObject, (err, data) => {
                                if (err) {
                                    return console.log(err);
                                }
                                console.log("New D Permission Generated Manually from UI with keySSI " + data.keySSI);
                            });
                        }
                        else {
                            console.log("USER DOES NOT AGREE")
                        }
                    }
                });
            }
        });


        // Send all the D.Permissions to Researcher
        this.DPermissionService.getDPermissions((err, data) => {
            if (err) {
                return console.log(err);
            }

            console.log("Sending to Researcher the D Permissions: " + (data.length));
            let DpermissionKeySSIlist = []
            data.forEach(d_permission => {
                DpermissionKeySSIlist.push(d_permission.KeySSI);
            })
            console.log(DpermissionKeySSIlist);
            this.CommunicationService = CommunicationService.getInstance(CommunicationService.identities.IOT.PATIENT_IDENTITY);
            this.sendMessageToResearcher('d-permission-list', DpermissionKeySSIlist);
        });

    }

    sendMessageToResearcher(operation, ssi_list) {
        this.CommunicationService.sendMessage(CommunicationService.identities.IOT.RESEARCHER_IDENTITY, {
            operation: operation,
            d_permission_keyssi_list: ssi_list
        });
    }

    _attachHandlerGoBack(){
        this.on('go-back', (event) => {
            console.log ("Go Back button pressed");
            this.navigateToPageTag('home');
        });
    }


    _attachHandlerParticipate(){
        this.on('participate-to-study', (event) => {
            console.log ("Participate to study button pressed");
            this.navigateToPageTag('participate-to-study');
        });
    }

    _attachHandlerMyStudies(){
        this.on('my-studies', (event) => {
            console.log ("My Studies button pressed");
            this.navigateToPageTag('my-studies');
        });
    }

    _attachHandlerGoToMyNotifications(){
        this.on('my-notifications', (event) => {
            console.log ("My notifications button pressed");
            let information_request_state = {
                ssi: this.model.ssi
            }
            this.navigateToPageTag('my-notifications', information_request_state);
        });
    }

    _isBlank(str) {
        return (!str || /^\s*$/.test(str));
    }



}