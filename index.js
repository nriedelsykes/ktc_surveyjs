document.addEventListener("DOMContentLoaded", init)

function init(){
    const json = {
        "checkErrorsMode": "onValueChanged",
        "title": "Timecard Edit Request",
        "pages": [
         {
          "name": "page1",
          "elements": [
           {
            "type": "text",
            "name": "change_date",
            "title": "Day of Change",
            "validators": [
             {
              "type": "expression",
              "text": "Date is invalid",
              "expression": "{change_date} notempty"
             }
            ],
            "inputType": "date",
            "maxValueExpression": "today()"
           },
           {
            "type": "matrixdynamic",
            "name": "timecard_edit",
            "title": "Timecard Edit Request",
            "columns": [
             {
              "name": "request_type",
              "title": "Request Type",
              "cellType": "dropdown",
              "minWidth": "300px",
              "validators": [
               {
                "type": "expression",
                "text": "Request Type is invalid",
                "expression": "{row.request_type} notempty"
               }
              ],
              "defaultValue": "regular_hours",
              "choices": [
               {
                "value": "regular_hours",
                "text": "Regular Hours"
               },
               {
                "value": "special_hours",
                "text": "Special Hours"
               }
              ],
              "storeOthersAsComment": true
             },
             {
              "name": "start_time",
              "title": "Start Time",
              "cellType": "text",
              "visibleIf": "{row.request_type} = 'regular_hours'",
              "validators": [
               {
                "type": "expression",
                "text": "Start time is invalid",
                "expression": "{row.start_time} notempty"
               }
              ],
              "inputType": "time"
             },
             {
              "name": "end_time",
              "title": "End Time",
              "cellType": "text",
              "visibleIf": "{row.request_type} = 'regular_hours'",
              "validators": [
               {
                "type": "expression",
                "text": "Start/End pair is invalid",
                "expression": "{row.end_time} notempty and {row.end_time} > {row.start_time}"
               }
              ],
              "inputType": "time"
             },
             {
              "name": "leave_type",
              "title": "Leave Type",
              "cellType": "dropdown",
              "visibleIf": "{row.request_type} = 'special_hours'",
              "validators": [
               {
                "type": "expression",
                "text": "Leave Type is invalid",
                "expression": "{row.leave_type} notempty"
               }
              ],
              "choices": [
               {
                "value": "absent",
                "text": "Absent"
               },
               {
                "value": "pto",
                "text": "PTO"
               },
               {
                "value": "bereavement",
                "text": "Bereavement"
               },
               {
                "value": "jury_duty",
                "text": "Jury Duty"
               }
              ],
              "showOtherItem": true,
              "storeOthersAsComment": true
             },
             {
              "name": "hours",
              "title": "Hours",
              "cellType": "text",
              "visibleIf": "{row.request_type} = 'special_hours'",
              "validators": [
               {
                "type": "expression",
                "text": "Hours only in 0.25 increments",
                "expression": "{row.hours} % 0.25 = 0"
               },
               {
                "type": "expression",
                "text": "Hours are invalid",
                "expression": "{row.hours} > 0"
               }
              ],
              "inputType": "number",
              "min": 0.25,
              "max": 24,
              "step": 0.25
             }
            ],
            "cellType": "text",
            "rowCount": 1,
            "minRowCount": 1,
            "maxRowCount": 10,
            "addRowText": "Add New Time"
           },
           {
            "type": "expression",
            "name": "hours_worked",
            "minWidth": "",
            "maxWidth": "",
            "title": "Calculated Hours Worked",
            "expression": "getHoursWorked({timecard_edit})"
           },
           {
            "type": "checkbox",
            "name": "attestation",
            "visibleIf": "{hours_worked} < 8",
            "title": "Did you work for less than 8 hours?",
            "validators": [
             {
              "type": "expression",
              "text": "Please confirm",
              "expression": "{attestation} allof ['partial_day']"
             }
            ],
            "choices": [
             {
              "value": "partial_day",
              "text": "Yes, I worked for less than 8 hours"
             }
            ],
            "selectAllText": "I worked for less than 8 hours"
           },
           {
            "type": "dropdown",
            "name": "timezone",
            "title": "Timezone",
            "validators": [
             {
              "type": "expression",
              "text": "Timezone is invalid",
              "expression": "{timezone} notempty"
             }
            ],
            "choices": [
             {
              "value": "easter",
              "text": "Eastern"
             },
             {
              "value": "central",
              "text": "Central"
             },
             {
              "value": "mountain",
              "text": "Mountain"
             },
             {
              "value": "pacific",
              "text": "Pacific"
             }
            ]
           }
          ]
         }
        ],
        "showQuestionNumbers": "off"
       };

    function getHoursWorked(params) {
        requestTimes = params[0]
        workedHours = 0;

        if(!Array.isArray(requestTimes)){
            return workedHours;
        }

        for (let time of requestTimes){
            if(!isValidTimecardRequest(time)){
                continue;
            }

            if(time.request_type === "regular_hours"){
                workedHours += elapsedHours(time.start_time, time.end_time);
            }

            if(time.request_type === "special_hours"){
                workedHours += parseFloat(time.hours);
            }
        }

        return workedHours
    }

    function elapsedHours(start, end){
        hours = 0;
        try{
            let t1 = Date.parse("01 Jan 1970 " + start) 
            let t2 = Date.parse("01 Jan 1970 " + end) 

            if(t1 >= t2) return hours;

            return Number(((t2 - t1)/3600000).toFixed(2))
        }
        catch(e){ }

        return hours
    }

    function validatePunches(_, options) {
        if (options.name === "timecard_edit"){
            if(isPunchOverlap(options.value)){
                options.error = "Punch values overlap"
            }

            return
        }
      }

    function isPunchOverlap(requests){
        punches = []

        for(let request of requests){
            if(isValidTimecardRequest(request) &&
               request.request_type == "regular_hours"){
                
                punches.push([Date.parse("01 Jan 1970 " + request.start_time), 
                Date.parse("01 Jan 1970 " + request.end_time)]);
            }
        }

        if(punches.length < 2){
            return false;
        }

        for(let i = 0; i < punches.length; i++){
            for(let j = i + 1; j < punches.length; j++){
                if(punches[i][0] <= punches[j][1] &&
                   punches[j][0] <= punches[i][1]){

                    return true;
                   }
            }
        }
        
        return false;
    }

    function isValidTimecardRequest(timeReq){
        if(timeReq.hasOwnProperty("request_type") &&
           timeReq.hasOwnProperty("start_time") &&
           timeReq.hasOwnProperty("end_time")){
                let hours = elapsedHours(timeReq.start_time, timeReq.end_time);

                return hours > 0;
           }

        if(timeReq.hasOwnProperty("request_type") &&
           timeReq.hasOwnProperty("leave_type") &&
           timeReq.hasOwnProperty("hours")){
                try{
                    return parseFloat(timeReq.hours) % 0.25 === 0
                }
                catch(e){ }
           }

        return false;
    }

    Survey.FunctionFactory.Instance.register("getHoursWorked", getHoursWorked);

    const survey = new Survey.Model(json);
    survey.onComplete.add((sender, options) => {
        console.log(JSON.stringify(sender.data, null, 3));
    });

    survey.onValidateQuestion.add(validatePunches);

    ko.applyBindings({
        model: survey
    }, document.getElementById("surveyElement"));

}
