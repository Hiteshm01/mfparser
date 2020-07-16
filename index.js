#!/usr/bin/env node

const parser = require('./lib/parser.js');
const fs = require('fs');
const xirr = require('xirr');
const json2xls = require('json2xls');

if (process.argv.length < 4) {
  console.log("Usage : node mfparser.js file password\n");
}
else {
  let filename = process.argv[2];
  let password = process.argv[3];
  var portfolioInvested = 0;
  var portfoilioValue = 0;
  var excelJson = [];
  var xirrInput = [];
  parser.parsePDF(filename, password)
    .then(data => {
      console.log(`Parse Success : Data for ${data.length} funds found.`);
      data.forEach(function (entry) {
        var input = [];
        var totalUnit = 0;
        var lastPrice = parseFloat(entry.Labels.NAV.replace(',',''));
        var lastDate;
        var totalAmount = 0;
        var totalInvestment = 0;
          entry.Transactions.forEach(function (tx)  {
            tx.Name = entry.Name;
            excelJson.push(tx);
            var d = new Date(tx.Date);
            var i = {
              amount: tx.Amount * -1,
              when: d
            }
            totalUnit += tx.Units;
            totalAmount += tx.Amount;
            lastDate = d;
            totalInvestment += tx.Amount
            input.push(i);
            xirrInput.push(i);
          });
          var finalValue = totalUnit * lastPrice;
        
          portfoilioValue += finalValue;
          portfolioInvested += totalInvestment;
          var current={
            amount: finalValue,
            when: new Date()
          };
          input.push(current);
          // console.log(input)
          entry.xirr = xirr(input)*100;
          xirrInput.push(current);
        //   console.log('Fund Name:' + entry.Name);
        //   console.log('Current NAV:' + lastPrice);
        //   console.log('Total units:' + totalUnit);
        //   console.log('Amount invested:' + totalInvestment);
        //   console.log('Amount now:' + finalValue);
        //   console.log('Return:' + entry.xirr);
        entry.totalAmount = totalAmount;
      });
      var finalXirr = xirr(xirrInput)*100;
      console.log('=======Summary=======');
      console.log('Total Amount invested: '+ portfolioInvested);
      console.log('Total valuation: ' + portfoilioValue);
      console.log('Profit: ' + (portfoilioValue - portfolioInvested));
      console.log('XIRR: '+ finalXirr);

      // console.log(JSON.stringify(data, null, 4));

      let outFile = "out.xls";
      var xls = json2xls(excelJson);
      fs.writeFile(outFile, xls, 'binary',err => {
        if (err) {
          console.log("An error ocurred creating the file "+ err.message)
        } else {
          console.log("The file has been succesfully saved:" + outFile);
        }
      });
    })
    .catch(console.log);
}

Date.prototype.addDays = function(days) {
    var date = new Date(this.valueOf());
    date.setDate(date.getDate() + days);
    return date;
}
