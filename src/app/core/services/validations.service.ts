import { Injectable } from "@angular/core";

@Injectable({
  providedIn: "root",
})
export class ValidationsService {
  constructor() {}

  loginNameValidation(evt: any) {
    var ASCIICode = evt.which ? evt.which : evt.keyCode;
    if (
      (ASCIICode >= 48 && ASCIICode <= 57) ||
      (ASCIICode >= 65 && ASCIICode <= 90) ||
      (ASCIICode >= 97 && ASCIICode <= 122) ||
      ASCIICode == 64 ||
      ASCIICode == 46
    ) {
      return true;
    } else {
      return false;
    }
  }
  // emailValidation(evt: any) {
  //   var ASCIICode = evt.which ? evt.which : evt.keyCode;
  //   if (
  //     (ASCIICode >= 48 && ASCIICode <= 57) ||
  //     (ASCIICode >= 65 && ASCIICode <= 90) ||
  //     (ASCIICode >= 97 && ASCIICode <= 122) ||
  //     ASCIICode == 64 ||
  //     ASCIICode == 46
  //   ) {
  //     return true;
  //   } else {
  //     return false;
  //   }
  // }
  passwordValidate(event: any) {
    const regex = /^[A-Za-z0-9.,@!^%$*]$/;

    const key = event.key; // ✅ Modern way

    if (!regex.test(key)) {
      event.preventDefault();
      return false;
    }

    return true;
  }
  personNameValidation(evt: any) {
    const code = evt.which ? evt.which : evt.keyCode;

    // A-Z, a-z, 0-9, @, . and Space
    if (
      (code >= 48 && code <= 57) ||
      (code >= 65 && code <= 90) ||
      (code >= 97 && code <= 122) ||
      code === 64 || // @
      code === 46 || // .
      code === 32 // Space
    ) {
      // Prevent multiple consecutive spaces
      if (code === 32 && evt.target.value.endsWith(" ")) {
        return false;
      }
      return true;
    }

    return false;
  }
  numberOnlyValidation(event: KeyboardEvent): boolean {
    const key = event.key;

    // Allow digits 0-9
    if (/^[0-9]$/.test(key)) {
      return true;
    }

    // Allow control keys
    const allowedKeys = [
      "Backspace",
      "Delete",
      "Tab",
      "ArrowLeft",
      "ArrowRight",
      "Home",
      "End",
    ];

    if (allowedKeys.includes(key)) {
      return true;
    }

    event.preventDefault();
    return false;
  }


  licencenoPattern = "^[a-zA-Z]{2}[0-9]{13}$";
  // onlyTextKey(e) {
  //   try {
  //     if (window.event) {
  //       var charCode = window.event["keyCode"];
  //     }
  //     else if (e) {
  //       var charCode = e.which;
  //     }
  //     else { return true; }
  //     if (charCode == 32)
  //       return true;
  //     if ((charCode > 64 && charCode < 91) || (charCode > 96 && charCode < 123))
  //       return true;
  //     else
  //       return false;
  //   }
  //   catch (err) {
  //     alert(err.Description);
  //   }
  // }

  onlyNumberKey(evt: any) {

    // Only ASCII character in that range allowed
    var ASCIICode = (evt.which) ? evt.which : evt.keyCode
    if (ASCIICode > 31 && (ASCIICode < 48 || ASCIICode > 57))
      return false;
    return true;
  }

  onlyNumberKeyWithSpace(evt: any) {
    // Only ASCII character in that range allowed
    var ASCIICode = (evt.which) ? evt.which : evt.keyCode
    if (ASCIICode > 31 && (ASCIICode < 48 || ASCIICode > 57))
      return false;
    return true;
  }

  alphanumeric(evt: any) {
    // Only ASCII character in that range allowed
    var ASCIICode = (evt.which) ? evt.which : evt.keyCode
    if ((ASCIICode >= 48 && ASCIICode <= 57) || (ASCIICode >= 65 && ASCIICode <= 90) || ((ASCIICode >= 97 && ASCIICode <= 122) || ASCIICode == 32))
      return true;
    return false;
  }


  welcomename(evt: any) {
    // Only ASCII character in that range allowed
    var ASCIICode = (evt.which) ? evt.which : evt.keyCode
    if ( (ASCIICode >= 65 && ASCIICode <= 90) || ((ASCIICode >= 97 && ASCIICode <= 122) || ASCIICode == 32) || ASCIICode == 40 || ASCIICode == 40 )
      return true;
    return false;
  }


  alphanumericWithoutSpace(evt: any) {
    // Only ASCII character in that range allowed
    var ASCIICode = (evt.which) ? evt.which : evt.keyCode
    if ((ASCIICode >= 48 && ASCIICode <= 57) || (ASCIICode >= 65 && ASCIICode <= 90) || ((ASCIICode >= 97 && ASCIICode <= 122)))
      return true;
    return false;
  }


  panNoValidation(evt: any) {
    // Only ASCII character in that range allowed
    var ASCIICode = (evt.which) ? evt.which : evt.keyCode
    if ((ASCIICode >= 48 && ASCIICode <= 57) || (ASCIICode >= 65 && ASCIICode <= 90) || ((ASCIICode >= 97 && ASCIICode <= 122) || ASCIICode == 32)) {
      return true;
    } else {
      return false;
    }
  }

  alphanumericWSpace(evt: any, inputValue: string) {
    var ASCIICode = evt.which ? evt.which : evt.keyCode;
  
    // Prevent space at the first position
    if (inputValue.length === 0 && ASCIICode === 32) {
      return false;
    }
  
    // Allow alphanumeric characters, spaces (not at the start), and commas
    if (
      (ASCIICode >= 48 && ASCIICode <= 57) ||  // 0-9
      (ASCIICode >= 65 && ASCIICode <= 90) ||  // A-Z
      (ASCIICode >= 97 && ASCIICode <= 122) || // a-z
      ASCIICode === 32 || // Space
      ASCIICode === 44    // Comma
    ) {
      return true;
    }
    
    return false;
  }
  
  

  addressValidation(evt: any) {
    // Only ASCII character in that range allowed
    var ASCIICode = (evt.which) ? evt.which : evt.keyCode
    if ((ASCIICode >= 48 && ASCIICode <= 57) || (ASCIICode >= 65 && ASCIICode <= 90) || (ASCIICode >= 97 && ASCIICode <= 122) || ASCIICode == 32 || ASCIICode == 44 || ASCIICode == 45 || ASCIICode == 46 || ASCIICode == 58)
      return true;
    return false;
  }

  searchBoxValidation(evt: any) {
    // Only ASCII character in that range allowed
    var ASCIICode = (evt.which) ? evt.which : evt.keyCode
    if ((ASCIICode >= 48 && ASCIICode <= 57) || (ASCIICode >= 65 && ASCIICode <= 90) || (ASCIICode >= 97 && ASCIICode <= 122) || ASCIICode == 32 || ASCIICode == 44 || ASCIICode == 45 || ASCIICode == 46 || ASCIICode == 58 || ASCIICode == 64)
      return true;
    return false;
  }

  validIp(evt: any) {
    // Only ASCII character in that range allowed
    var ASCIICode = (evt.which) ? evt.which : evt.keyCode
    if ((ASCIICode >= 48 && ASCIICode <= 57) || ASCIICode == 46)
      return true;
    return false;
  }

  emailValidation(evt: any) {
    var ASCIICode = (evt.which) ? evt.which : evt.keyCode;
    if (((ASCIICode >= 48 && ASCIICode <= 57) || (ASCIICode >= 65 && ASCIICode <= 90) || (ASCIICode >= 97 && ASCIICode <= 122) || ASCIICode == 64 || ASCIICode == 46)) {
      return true;
    } else {
      return false;
    }
  }
  // onlyForUrl(e: any) {
  //   try {
  //     if (window.event) {
  //       var charCode = window.event["keyCode"];
  //     }
  //     else if (e) {
  //       var charCode = e.which;
  //     }
  //     else { return true; }

  //     if ((charCode > 64 && charCode < 91) || (charCode > 96 && charCode < 123) || charCode == 47 || charCode == 45 || charCode == 95)
  //       return true;
  //     else
  //       return false;
  //   }
  //   catch (err) {
  //     alert(err.Description);
  //   }
  // }

  // onlyForIcon(e:any) {
  //   try {
  //     if (window.event) {
  //       var charCode = window.event["keyCode"];
  //     }
  //     else if (e) {
  //       var charCode = e.which;
  //     }
  //     else { return true; }

  //     if ((charCode > 64 && charCode < 91) || (charCode > 96 && charCode < 123) || charCode == 47 || charCode == 45 || charCode == 32)
  //       return true;
  //     else
  //       return false;
  //   }
  //   catch (err) {
  //     alert(err.Description);
  //   }
  // }

  searchInputValidation(event: any) {
    var inp = String.fromCharCode(event.keyCode);
    // Allow numbers, alpahbets, space, underscore
    if (/[a-zA-Z0-9/\w\s]/.test(inp)) {
      return true;
    } else {
      event.preventDefault();
      return false;
    }
  }
  addressValidate(event: any) {
    var inp = String.fromCharCode(event.keyCode);
    // Allow numbers, alpahbets, space, underscore
    if (/[a-zA-Z0-9-,./\w\s]/.test(inp)) {
      return true;
    } else {
      event.preventDefault();
      return false;
    }
  }


  isLoginName(evt: any) {
    var keyCode = (evt.which) ? evt.which : evt.keyCode;
    if ((keyCode < 65 || keyCode > 90) && (keyCode < 97 || keyCode > 122) && (keyCode < 48 || keyCode > 59) && keyCode != 32 && keyCode != 33 && keyCode != 64 && keyCode != 36
      && keyCode != 45 && keyCode != 46 && keyCode != 95)
      return false;
    return true;
  }

  voterIdPattern = "^([a-zA-Z]){3}([0-9]){7}?$"
  pannoPattern = "^([a-zA-Z]){5}([0-9]){4}([a-zA-Z]){1}?$"
  veiclenumberPattern = "[A-Za-z]{2}[0-9]{2}"
  latitudePatern = "^(\+|-)?(?:90(?:(?:\.0{1,6})?)|(?:[0-9]|[1-8][0-9])(?:(?:\.[0-9]{1,6})?))$"
  vehicleNumberInput(event: any) {
    var inp = String.fromCharCode(event.keyCode);
    // Allow numbers, alpahbets, space, underscore
    if (/[A-Za-z]{2}[0-9]{2}]/.test(inp) && event.length < 4) {
      return true;
    } else {
      event.preventDefault();
      return false;
    }
  }

  //lat long validation
  validationLatLong(event: any) {
    var charCode = (event.which) ? event.which : event.keyCode;
    if (charCode != 46 && charCode > 31 && (charCode < 48 || charCode > 57))
      return false;
    if (event.target.value.indexOf('.') >= 0 && charCode == 46)
      return false;

    return true;
  }
  //model name validtion
  modelnamevalidation(event: any) {
    var inp = String.fromCharCode(event.keyCode);
    // Allow numbers, alpahbets, space, underscore
    if (/[a-zA-Z0-9-\s]/.test(inp)) {
      return true;
    } else {
      event.preventDefault();
      return false;
    }
  }

  //model name validtion
  menuurlvalidation(event: any) {
    var inp = String.fromCharCode(event.keyCode);
    // Allow numbers, alpahbets, space, underscore
    if (/[/a-zA-Z\s]/.test(inp)) {
      return true;
    } else {
      event.preventDefault();
      return false;
    }
  }
  // passwordValidate(event: any) {
  //   var regex = /^[A-Za-z0-9.,@!^%$*]$/;

  //   var key = String.fromCharCode(event.charCode ? event.which : event.charCode);
  //   if (!regex.test(key)) {
  //     event.preventDefault();
  //     return false;
  //   }
  // }

    //firmware version
    firmwareVersion(event: any) {
      // var regex = /^[a-z0-9./()]+$/;
      // var key = String.fromCharCode(event.charCode ? event.which : event.charCode);
      // if (!regex.test(key)) {
      //   event.preventDefault();
      //   return false;
      // }

      // var inp = String.fromCharCode(event.keyCode);
      // // Allow numbers, alpahbets, space, underscore
      // if (/[a-z0-9./()]/.test(inp)) {
      //   return true;
      // } else {
      //   event.preventDefault();
      //   return false;
      // }

      var ASCIICode = (event.which) ? event.which : event.keyCode
      if ((ASCIICode >= 46 && ASCIICode <= 57)  )
        return true;
      return false;
    }
}
