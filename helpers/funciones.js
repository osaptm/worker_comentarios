const axios = require('axios');
const mutex = require('async-mutex').Mutex;

async function checkURL(url) {
    await axios.get(url).then((response) => {
      return true;
    }).catch((error) => {
      return false;
    });
  }

 class MyProxyClass {
    constructor(){
      this.array_proxy = [
        "165.231.95.148",
        "45.95.118.28",
        "165.231.95.17",
        "196.196.34.44",
        "185.158.104.152",
        "165.231.95.118",
        "50.3.198.225",
        "185.158.104.33",
        "185.158.106.179",
        "196.196.34.72",
        "185.158.106.153",
        "185.158.104.161",
        "5.157.55.128",
        "196.196.220.229",
        "196.196.34.180",
        "50.3.198.89",
        "50.3.198.30",
        "45.95.118.191",
        "196.196.34.84",
        "50.3.198.193"
      ];
      this.temp_array_proxy = [...this.array_proxy];
      this.mutex = new mutex();
    }

    async accessResourceProxy() {
      const release = await this.mutex.acquire();
      try {
          return  this.oneProxy();
      } catch (error) {
          console.log("Error Mutex Proxy " + error);
      } finally {
          release(); 
      }
    };

    elimina_proxy(position){
      this.temp_array_proxy.splice(position, 1);
    };

    oneProxy() {
      if (this.temp_array_proxy.length === 0) { this.temp_array_proxy = [...this.array_proxy]; }
      let position = Math.floor(Math.random() * (this.temp_array_proxy.length - 1));
      let proxy = this.temp_array_proxy[position];
      this.elimina_proxy(position);
      return proxy;
   };

 }

module.exports = {
  checkURL,
  MyProxyClass
}