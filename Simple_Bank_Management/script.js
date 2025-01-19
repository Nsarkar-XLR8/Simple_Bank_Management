class BankAccount {
    constructor(name,balance,accountType){
        this.name = name;
        this.balance = parseFloat(balance);
        this.accountType = accountType;
        this.transactionHistory = [`Initial Deposit: ${this.balance}`];
    }

    deposit(amount) {
        this.balance += amount;
        this.transactionHistory.push(`Deposit: ${amount}`);
    }

    withdraw(amount) {
        if(amount > this.balance ){
            console.log("Insufficient funds");
        }else{
            this.balance -= amount;
            this.transactionHistory.push(`Withdraw : ${amount}`);
        }
    }

}

class Bank {
    constructor() {
        this.accounts = [];
    }

    addAccount(account) {
        this.accounts.push(account);
        this.displayAccounts();
      }

    deposit(index,amount){
        this.accounts[index].deposit(amount);
        this.accounts[index].transactionHistory.push(`Deposit: ${amount}`);
    }

    withdraw(index,amount){
        this.accounts[index].withdraw(amount);
        this.accounts[index].transactionHistory.push(`Withdraw: ${amount}`);
    }

    displayAccounts (){
        const accountList = document.getElementById('accountsList');
        accountList.innerHTML = "";

        this.accounts.forEach((account,index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${account.name}</td>
                <td>${account.balance}</td>
                <td>${account.accountType}</td>
                <td>
                    <button onclick="bank.viewDetails(${index})">View</button>
                    <button onclick="bank.depositPrompt(${index})">Deposit</button>
                    <button onclick="bank.withdrawPrompt(${index})">Withdraw</button>
                </td>

            
            `;
            accountList.appendChild(row);

        })

    }

    viewDetails(index) {
        const account = this.accounts[index];
        alert(`Account Details:\nName: ${account.name}\nBalance: $${account.balance.toFixed(2)}\nAccount Type: ${account.accountType}\nTransaction History:\n${account.transactionHistory.join("\n")}`);
      }
    
      depositPrompt(index) {
        const amount = parseFloat(prompt("Enter deposit amount:"));
        if (!isNaN(amount) && amount > 0) {
          this.deposit(index, amount);
        } else {
          alert("Invalid amount!");
        }
      }
    
      withdrawPrompt(index) {
        const amount = parseFloat(prompt("Enter withdrawal amount:"));
        if (!isNaN(amount) && amount > 0) {
          this.withdraw(index, amount);
        } else {
          alert("Invalid amount!");
        }
      }
    }
    
    // Initialize the bank
    const bank = new Bank();
    
    // Handle form submission
    document.getElementById("bankForm").addEventListener("submit", function (e) {
      e.preventDefault();
      const name = document.getElementById("name").value;
      const balance = document.getElementById("balance").value;
      const accountType = document.getElementById("accountType").value;
    
      const newAccount = new BankAccount(name, balance, accountType);
      bank.addAccount(newAccount);
    
      this.reset();
    });
