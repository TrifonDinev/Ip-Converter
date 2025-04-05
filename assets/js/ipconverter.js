document.addEventListener("DOMContentLoaded", function () {
  const darkModeToggleButton = document.getElementById('darkModeToggle');
  const convertButton = document.getElementById('convertButton');
  const ipAddressInput = document.getElementById('ipInput');
  const subnetMaskInput = document.getElementById('subnetMask');
  const outputDisplay = document.getElementById('output');

  // Check user preferred color scheme (dark or light mode)
  const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;

  // Apply dark mode class to body if the user prefers dark mode
  document.body.classList.toggle('dark', prefersDarkMode);

  // Update the toggle button text based on the system color scheme preference
  // If the user prefers dark mode, the button text will show 'Light Mode', otherwise 'Dark Mode'
  darkModeToggleButton.innerHTML = `<span class="moon-icon">🌙</span>${prefersDarkMode ? 'Light Mode' : 'Dark Mode'}`;

  // Add event listener to the toggle button to switch between light and dark modes when clicked
  darkModeToggleButton.addEventListener('click', () => {

    // Toggle the 'dark' class on the body element
    const isDark = document.body.classList.toggle('dark');

    // Update the button text based on the current theme (light or dark)
    // If dark mode is active, show 'Light Mode', otherwise 'Dark Mode'
    darkModeToggleButton.innerHTML = `<span class="moon-icon">🌙</span>${isDark ? 'Light Mode' : 'Dark Mode'}`;
  });

  // Event listener for the conversion button
  convertButton.addEventListener('click', handleConversion);

  /**
  * Handle the conversion process when the convert button is clicked.
  * Validate the IP and subnet mask, then generate the result and display it.
  */
  function handleConversion() {
    const ipAddress = ipAddressInput.value.trim();
    const subnetMask = subnetMaskInput.value.trim();

    // Clear previous output
    outputDisplay.innerHTML = '';

    // Validate the IP address format
    if (!validateIPFormat(ipAddress)) {
      outputDisplay.innerHTML = `<div class="output">Invalid IP address!</div>`;
      outputDisplay.classList.add('visible');
      outputDisplay.classList.remove('subnet-info');
      return;
    }

    // Validate the subnet mask format (if provided)
    if (subnetMask && !validateSubnetMaskFormat(subnetMask)) {
      outputDisplay.innerHTML = `<div class="output">Invalid subnet mask!</div>`;
      outputDisplay.classList.add('visible');
      outputDisplay.classList.remove('subnet-info');
      return;
    }

    // Perform the IP conversion and display the result
    const conversionResult = convertIPv4(ipAddress, subnetMask);
    outputDisplay.innerHTML = `${conversionResult}`;
    outputDisplay.classList.add('visible');

    // Smooth scroll to the output section after conversion
    outputDisplay.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /**
  * Validate the format of an IPv4 address.
  * @param {string} ipAddress The IP address to validate. Expected format: "xxx.xxx.xxx.xxx" where each "xxx" is a number between 0 and 255.
  * @return {boolean} True if the IP address is valid, false otherwise.
  */
  function validateIPFormat(ipAddress) {
    const ipv4Pattern = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){2}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    return ipv4Pattern.test(ipAddress);
  }

  /**
  * Validate the format of a subnet mask in CIDR notation.
  * @param {string} subnetMask The subnet mask to validate, which should be a number between 1 and 32 (inclusive)
  * representing the number of bits in the subnet mask.
  * @return {boolean} True if the subnet mask is valid, false otherwise.
  */
  function validateSubnetMaskFormat(subnetMask) {
    const maskBits = parseInt(subnetMask.replace('/', ''), 10);
    return !isNaN(maskBits) && maskBits >= 1 && maskBits <= 32;
  }

  /**
  * Convert an IPv4 address to various formats, including hexadecimal, binary, octal,
  * and provide the reverse DNS format, along with subnet information if a subnet mask is provided.
  * @param {string} ipAddress The IPv4 address to convert.
  * @param {string} [subnetMask] The optional subnet mask for more detailed subnet information.
  * @return {string} An HTML string containing a table of the converted results (e.g., binary, hexadecimal, etc.).
  */
  function convertIPv4(ipAddress, subnetMask) {

    // Split the IP address into an array of octets (numbers)
    const octets = ipAddress.split('.').map(Number);

    // The first octet is used for determining the IP class
    const firstOctet = octets[0];

    // Determine the class of the IP address
    const ipClass = firstOctet >= 1 && firstOctet <= 127 ? 'A' :
                    firstOctet >= 128 && firstOctet <= 191 ? 'B' :
                    firstOctet >= 192 && firstOctet <= 223 ? 'C' :
                    firstOctet >= 224 && firstOctet <= 239 ? 'D' : 'E';

    // Convert IP address to an integer representation
    const ipAsInt = ((octets[0] << 24) | (octets[1] << 16) | (octets[2] << 8) | octets[3]) >>> 0;

    // Convert each octet to binary, pad with leading zeros to ensure it's 8 bits, and join them with dots
    const binary = octets.map(octet => octet.toString(2).padStart(8, '0')).join('.');

    // Convert each octet to hexadecimal, pad with leading zeros to ensure it's 2 digits,
    // prefix with '0x' to indicate hexadecimal, and join them together without dots
    const hex = '0x' + octets.map(octet => octet.toString(16).padStart(2, '0').toUpperCase()).join('');

    // Convert each octet to octal, and join them with dots
    const octal = octets.map(octet => octet.toString(8)).join('.');

    // Convert to Little Endian Format
    const hostByteOrderLittleEndian = (octets[0] | (octets[1] << 8) | (octets[2] << 16) | (octets[3] << 24)) >>> 0;

    // Reverse DNS Format (used for reverse lookups)
    const reverseDNS = `${octets.reverse().join('.')}.in-addr.arpa`;

    // If subnetMask is provided, calculate subnet information
    let subnetInfo = subnetMask ? getSubnetInfo(ipAddress, subnetMask, octets) : '';

    // Set output max-width based on subnetInfo, so we can split to two tables if needed
    outputDisplay.classList.toggle('subnet-info', subnetInfo);

    // Prepare the base IP info table
    const ipInfoTable = `
    <table class="output-table">
    <thead>
    <tr><th>Property</th><th>Value</th></tr>
    </thead>
    <tbody>
    <tr><td>IPv4 Address</td><td>${ipAddress}</td></tr>
    <tr><td>IP Class</td><td>${ipClass}</td></tr>
    <tr><td>Dotted Octal</td><td>${octal}</td></tr>
    <tr><td>Hexadecimal</td><td>${hex}</td></tr>
    <tr><td>Integer</td><td>${ipAsInt}</td></tr>
    <tr><td>Binary Format</td><td>${binary}</td></tr>
    <tr><td>Network Byte Order (Big Endian)</td><td>0x${ipAsInt.toString(16).padStart(8, '0').toUpperCase()}</td></tr>
    <tr><td>Host Byte Order (Little Endian)</td><td>0x${hostByteOrderLittleEndian.toString(16).padStart(8, '0').toUpperCase()}</td></tr>
    <tr><td>Reverse DNS (in-addr.arpa)</td><td>${reverseDNS}</td></tr>
    </tbody>
    </table>`;

    // Prepare the subnet info table if subnetInfo exists
    const subnetTable = subnetInfo ? `
    <table class="output-table">
    <thead>
    <tr><th colspan="2">Subnet Mask ${subnetMask}</th></tr>
    </thead>
    <tbody>${subnetInfo}</tbody>
    </table>` : '';

    // Combine both tables if subnet info is present
    return `
    <div class="tables-container">
    ${ipInfoTable}
    ${subnetTable}
    </div>`;
  }

  /**
  * Calculate and return detailed subnet information based on the provided IP address and subnet mask.
  * This includes network address, broadcast address, usable IP range, and other subnet-related details.
  * @param {string} ipAddress The IP address to use for subnet calculation.
  * @param {string} subnetMask The subnet mask to use for calculating subnet details.
  * @param {number[]} octets The array of octets derived from the IP address.
  * @return {string} An HTML string containing subnet details like network address, broadcast address, etc.
  */
  function getSubnetInfo(ipAddress, subnetMask, octets) {

    // Convert an integer to dotted decimal format (e.g., 2130706433 -> "127.0.0.1")
    function intToDottedDecimal(num) {
      return [(num >>> 24) & 255, (num >>> 16) & 255, (num >>> 8) & 255, num & 255].join('.');
    }

    // Format a number with commas for thousands, millions, etc., and apply locale-based formatting.
    function formatNumber(num) {
      return num.toLocaleString();
    }

    // Convert a subnet mask from its bit-length (CIDR notation) to dotted decimal format.
    function getDottedDecimalNetmask(maskBits) {
      const mask = (0xFFFFFFFF << (32 - maskBits)) >>> 0;
      return intToDottedDecimal(mask);
    }

    // Compute the wildcard mask (inverse of the subnet mask) and return it in dotted decimal format.
    function getWildcardMask(maskBits) {
      const wildcardBits = 32 - maskBits;
      const wildcard = (0xFFFFFFFF >>> (32 - wildcardBits)) >>> 0;
      return intToDottedDecimal(wildcard);
    }

    // Return the binary representation of a subnet mask based on the CIDR notation (mask bits).
    function getBinarySubnetMask(maskBits) {
      //return '1'.repeat(maskBits) + '0'.repeat(32 - maskBits);
      return ('1'.repeat(maskBits) + '0'.repeat(32 - maskBits)).match(/.{8}/g).join('.');
    }

    // Convert a subnet mask from big endian to little endian format.
    function toLittleEndianSubnetMask(mask) {
      return (((mask >>> 24) & 0xFF) | ((mask >>> 8) & 0xFF00) | ((mask << 8) & 0xFF0000) | ((mask << 24) & 0xFF000000)) >>> 0;
    }

    // Get the number of bits in the subnet mask (from CIDR notation)
    const maskBits = parseInt(subnetMask.replace('/', ''), 10);

    // Convert subnet mask to integer representation
    const subnetMaskInt = (0xFFFFFFFF << (32 - maskBits)) >>> 0;

    // Convert IP address to 32-bit integer
    const ipAsInt = (octets[0] | (octets[1] << 8) | (octets[2] << 16) | (octets[3] << 24)) >>> 0;

    // Calculate the network address by performing a bitwise AND between the IP address and the subnet mask
    const networkAddress = ipAsInt & subnetMaskInt;

    // Calculate the broadcast address by performing a bitwise OR between the network address and the inverse of the subnet mask
    const broadcastAddress = networkAddress | (~subnetMaskInt >>> 0);

    // Calculate the total number of hosts and usable hosts in the subnet
    const totalHosts = Math.pow(2, 32 - maskBits);

    // Calculate the number of usable hosts, which is the total number of hosts minus 2 (network and broadcast addresses)
    const usableHosts = maskBits === 31 || maskBits === 32 ? 0 : totalHosts - 2;

    // Calculate the usable IP range for the subnet, for /31 and /32, there are no usable hosts
    const usableIP = (maskBits < 31) ? `${intToDottedDecimal(networkAddress + 1)} - ${intToDottedDecimal(broadcastAddress - 1)}` : 'N/A';

    // Format the subnet mask into dotted decimal notation (e.g., 255.255.255.0)
    const dottedDecimalNetmask = getDottedDecimalNetmask(maskBits);

    // Calculate the wildcard mask (inverse of the subnet mask), used for matching IP address ranges
    const wildcardMask = getWildcardMask(maskBits);

    // Get the binary representation of the subnet mask (e.g., "11111111.11111111.11111111.00000000")
    const binarySubnetMask = getBinarySubnetMask(maskBits);

    // Convert the subnet mask from big-endian to little-endian format, since our system is in little endian byte order
    const littleEndianSubnet = toLittleEndianSubnetMask(subnetMaskInt);

    return `
    <tr><td>Network Address</td><td>${intToDottedDecimal(networkAddress)}</td></tr>
    <tr><td>Broadcast Address</td><td>${intToDottedDecimal(broadcastAddress)}</td></tr>
    <tr><td>Usable IP Range</td><td>${usableIP}</td></tr>
    <tr><td>Total Number of Hosts</td><td>${formatNumber(totalHosts)}</td></tr>
    <tr><td>Number of Usable Hosts</td><td>${formatNumber(usableHosts)}</td></tr>
    <tr><td>Netmask</td><td>${subnetMask} (${dottedDecimalNetmask})</td></tr>
    <tr><td>Wildcard Mask</td><td>${wildcardMask}</td></tr>
    <tr><td>Binary Subnet Mask</td><td>${binarySubnetMask}</td></tr>
    <tr><td>Network Byte Order (Big Endian) Subnet Mask</td><td>0x${subnetMaskInt.toString(16).padStart(8, '0').toUpperCase()}</td></tr>
    <tr><td>Host Byte Order (Little Endian) Subnet Mask</td><td>0x${littleEndianSubnet.toString(16).padStart(8, '0').toUpperCase()}</td></tr>
    `;
  }
});