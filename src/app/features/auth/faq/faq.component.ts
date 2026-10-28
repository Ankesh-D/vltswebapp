import { Component, ChangeDetectionStrategy } from '@angular/core';


@Component({
    selector: 'app-faq',
    imports: [],
    templateUrl: './faq.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './faq.component.scss'
})
export class FaqComponent {


  faqs = [

    // ===========================
    // Vehicle Installation
    // ===========================

    {
      category: 'Vehicle Installation & Activation',
      image: 'assets/installation.jpeg',

      questions: [

        {
          question: 'How do I search a vehicle?',
          answer: `
          <ol>
            <li>Open <b>Vehicle Installation & Activation</b>.</li>
            <li>Enter the <b>IMEI Number</b>.</li>
            <li>Click <b>Search</b>.</li>
            <li>Vehicle, Device and Compliance details will be displayed.</li>
          </ol>`
        },

        {
          question: 'What information is available after searching?',
          answer: `

          <h5>Device Details</h5>

          <ul>
            <li>Manufacturer Name</li>
            <li>Serial Number</li>
            <li>ICCID Number</li>
            <li>IMEI Number</li>
            <li>Model Code</li>
            <li>eSIM Provider</li>
            <li>SIM Numbers</li>
            <li>Network Details</li>
            <li>SIM Validity</li>
          </ul>

          <h5>Vehicle Details</h5>

          <ul>
            <li>Vehicle Type</li>
            <li>Vehicle Number</li>
            <li>Chassis Number</li>
            <li>Engine Number</li>
            <li>Make</li>
            <li>Model</li>
            <li>Vehicle Class</li>
            <li>Customer Details</li>
            <li>Dealer</li>
            <li>RTO</li>
            <li>Manufacturing Year</li>
            <li>Assignment Date</li>
          </ul>

          <h5>AIS Compliance</h5>

          <ul>
            <li>Activation Compliance</li>
            <li>Communication Mode</li>
            <li>GPS Status</li>
            <li>Polling Status</li>
            <li>Polling Time</li>
            <li>Last Panic Event</li>
            <li>Panic Location</li>
            <li>OTP Status</li>
          </ul>
          `
        },

        {
          question: 'What does GPS Status mean?',
          answer: `

          <table class="table table-bordered">

          <tr>
          <th>Status</th>
          <th>Meaning</th>
          </tr>

          <tr>
          <td><span class="text-success"><b>GPS Valid</b></span></td>
          <td>GPS data is being received correctly.</td>
          </tr>

          <tr>
          <td><span class="text-danger"><b>GPS Invalid</b></span></td>
          <td>GPS location is unavailable or incorrect.</td>
          </tr>

          </table>
          `
        },

        {
          question: 'What is Polling Status?',
          answer: `

          <table class="table table-bordered">

          <tr>
          <th>Status</th>
          <th>Description</th>
          </tr>

          <tr>
          <td>Received</td>
          <td>Device is communicating successfully.</td>
          </tr>

          <tr>
          <td>Not Received</td>
          <td>Backend is not receiving packets.</td>
          </tr>

          <tr>
          <td>Never Received</td>
          <td>Device has never communicated.</td>
          </tr>

          </table>
          `
        },

        {
          question: 'What is Activation Compliance?',
          answer: `

          Activation Compliance indicates how many AIS-140 mandatory checks have passed.

          <br><br>

          <b>Example:</b>

          <div class="alert alert-success text-center">

          <h3>16 / 17</h3>

          </div>

          <b>Meaning</b>

          <ul>
          <li>16 checks Passed</li>
          <li>1 check Failed</li>
          </ul>

          `
        }

      ]

    },



    // ===========================
    // Compliance
    // ===========================

    {
      category: 'Compliance Check',
      image: 'assets/faq/Image-2_Compliance_Check.png',

      questions: [

        {
          question: 'What are the Compliance Checks?',
          answer: `

          <table class="table table-striped app-table table-bordered">

          <tr>

          <th>Check</th>

          <th>Description</th>

          </tr>

          <tr><td>Auth</td><td>Device Authentication</td></tr>

          <tr><td>Disconnected Alert</td><td>Alert generated after device disconnect</td></tr>

          <tr><td>Frequency 10s</td><td>Data transmitted every 10 seconds</td></tr>

          <tr><td>GPS Validation</td><td>GPS coordinates are valid</td></tr>

          <tr><td>Latency</td><td>Acceptable communication delay</td></tr>

          <tr><td>Movement Detected</td><td>Vehicle movement detected</td></tr>

          <tr><td>Network Stable</td><td>Stable GSM Network</td></tr>

          <tr><td>Network Switch</td><td>SIM Switching working</td></tr>

          <tr><td>No Packet Loss</td><td>No missing packets</td></tr>

          <tr><td>No Tamper</td><td>Tamper event not detected</td></tr>

          <tr><td>Power Connected</td><td>Main power connected</td></tr>

          <tr><td>Protocol Match</td><td>Device using supported protocol</td></tr>

          <tr><td>Raw Data</td><td>Raw packets received</td></tr>

          <tr><td>Secure APN</td><td>Device connected through secure APN</td></tr>

          <tr><td>Signal</td><td>GSM Signal available</td></tr>

          <tr><td>SMS ACK</td><td>SMS acknowledgement received</td></tr>

          <tr><td>Time Synced</td><td>Device time synchronized</td></tr>

          </table>

          `
        },

        {
          question: 'What do the icons mean?',
          answer: `

          <h4>✅ Green Tick</h4>

          Validation Passed

          <br><br>

          <h4>❌ Red Cross</h4>

          Validation Failed

          `
        },

        {
          question: 'Why is Movement Detected showing Failed?',
          answer: `

          <b>Possible Reasons</b>

          <ul>

          <li>Vehicle has not moved.</li>

          <li>GPS movement not detected.</li>

          <li>Device installed but vehicle stationary.</li>

          <li>Required distance not travelled.</li>

          </ul>

          <b>Resolution</b>

          <br>

          Drive the vehicle for a short distance and verify again.

          `
        }

      ]

    },



    // ===========================
    // Renewal
    // ===========================

    {
      category: 'Device Renewal',
      image: 'assets/faq/Image-3_Device_Renewal.png',

      questions: [

        {
          question: 'How do I search a device for renewal?',
          answer: `

          <ol>

          <li>Open AIS-140 / BIS 16833 Device Renewal.</li>

          <li>Enter IMEI or Serial Number.</li>

          <li>Click Search.</li>

          </ol>

          `
        },

        {
          question: 'What details are displayed?',
          answer: `

          <h5>Vehicle Details</h5>

          Vehicle Number, Chassis Number, Engine Number, Customer Name,
          Mobile Number, Manufacturing Year, Make, Model, Vehicle Class & RTO.

          <br><br>

          <h5>Device Details</h5>

          Activation Number, Serial Number, IMEI, ICCID,
          Model Name, SIM Details & Manufacturer.

          <br><br>

          <h5>Connectivity Details</h5>

          Activation Compliance, SIM Validity, Backend Validity,
          Polling Time, Connection Status,
          Communication Mode, Last Alert & Last Alert Time.

          `
        },

        {
          question: 'What is SIM Validity?',
          answer: `

          Displays the expiry date of the installed SIM.

          <br><br>

          Example

          <div class="alert alert-info">

          <b>31-Jul-2028</b>

          </div>

          `
        },

        {
          question: 'How can I update SIM Validity?',
          answer: `

          Click the <b>Update</b> button.

          The latest validity will be fetched automatically from the backend.

          `
        },

        {
          question: 'What does Connected status mean?',
          answer: `

          <ul>

          <li>Device is Online.</li>

          <li>Backend is receiving packets.</li>

          <li>Communication is Active.</li>

          </ul>

          `
        },

        {
          question: 'What is Mode?',
          answer: `

          <div class="alert alert-success">

          <h3>TCP</h3>

          </div>

          Means the device communicates using TCP Protocol.

          `
        },

        {
          question: 'What is Send OTP for Renewal?',
          answer: `

          Sends OTP to the registered customer mobile number
          before device renewal.

          `
        }

      ]

    },



    // ===========================
    // Renewal Compliance
    // ===========================

    {
      category: 'Renewal Compliance',
      image: 'assets/faq/Image-4_Renewal_Compliance.png',

      questions: [

        {
          question: 'Why cannot I proceed with Renewal?',
          answer: `

          <ul>

          <li>Compliance Pending</li>

          <li>GPS Invalid</li>

          <li>Polling Not Received</li>

          <li>Device Offline</li>

          <li>OTP Not Verified</li>

          <li>Movement Not Detected</li>

          <li>Backend Validation Pending</li>

          </ul>

          `
        },

        {
          question: 'What should I do if Compliance is Pending?',
          answer: `

          Verify the following:

          <ul>

          <li>Device Powered ON</li>

          <li>GPS Available</li>

          <li>SIM Active</li>

          <li>Packets Receiving</li>

          <li>Vehicle Moved</li>

          <li>OTP Verified</li>

          </ul>

          `
        }

      ]

    },



    // ===========================
    // Common Issues
    // ===========================

    {
      category: 'Common Issues',
      image: '',

      questions: [

        {
          question: 'Frequently Encountered Issues',
          answer: `

          <table class="table table-bordered">

          <tr>

          <th>Issue</th>

          <th>Resolution</th>

          </tr>

          <tr><td>IMEI Not Found</td><td>Verify IMEI and Search Again</td></tr>

          <tr><td>GPS Invalid</td><td>Move Vehicle to Open Sky</td></tr>

          <tr><td>Polling Not Received</td><td>Check Device Communication</td></tr>

          <tr><td>OTP Failed</td><td>Resend OTP</td></tr>

          <tr><td>SIM Expired</td><td>Update SIM Validity</td></tr>

          <tr><td>Compliance Pending</td><td>Complete Pending Validations</td></tr>

          <tr><td>Device Offline</td><td>Check Power & Network</td></tr>

          <tr><td>Movement Failed</td><td>Drive Vehicle and Retry</td></tr>

          </table>

          `
        }

      ]

    }

  ];


}
