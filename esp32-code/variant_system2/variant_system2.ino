// varaint_system2.ino
#include "credentials.h"

#include <Arduino.h>
#if defined(ESP32) || defined(ARDUINO_RASPBERRY_PI_PICO_W)
#include <WiFi.h>
#elif defined(ESP8266)
#include <ESP8266WiFi.h>
#elif __has_include(<WiFiNINA.h>)
#include <WiFiNINA.h>
#elif __has_include(<WiFi101.h>)
#include <WiFi101.h>
#elif __has_include(<WiFiS3.h>)
#include <WiFiS3.h>
#endif


#include <Firebase_ESP_Client.h>
#include <addons/TokenHelper.h>
#include <addons/RTDBHelper.h>

#include <RTClib.h>
RTC_DS3231 rtc;


// Define Firebase Data object
FirebaseData fbdo;

FirebaseAuth auth;
FirebaseConfig config;

unsigned long sendDataPrevMillis = 0;

const byte batteryPercentagePin = 36;
const byte moistureSensorPin1 = 33;
const byte moistureSensorPin2 = 32;
const byte builtinLED = 2;

// Define Firebase paths as constants
const String path0 = "/users/" + String(USER_ID) + "/" + String(SYSTEM_ID) + "/enable";
const String path1 = "/users/" + String(USER_ID) + "/" + String(SYSTEM_ID) + "/battery";
const String path2 = "/users/" + String(USER_ID) + "/" + String(SYSTEM_ID) + "/lastUpdated";
const String path3 = "/users/" + String(USER_ID) + "/" + String(SYSTEM_ID) + "/soilMoisture1";
const String path4 = "/users/" + String(USER_ID) + "/" + String(SYSTEM_ID) + "/soilMoisture2";

void initialized_used_pins() {
  pinMode(batteryPercentagePin, INPUT);
  pinMode(moistureSensorPin1, INPUT);
  pinMode(moistureSensorPin2, INPUT);
  pinMode(builtinLED, OUTPUT);
}

void setup_WiFi() {
  Serial.print("Connecting to Wi-Fi");
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  unsigned long startAttemptTime = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - startAttemptTime < 30000) {  // 30s timeout
    Serial.print(".");
    digitalWrite(builtinLED, LOW);
    delay(1000);
    digitalWrite(builtinLED, HIGH);
    delay(1000);
  }

  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("\nFailed to connect to WiFi!");
    while (true) {
      digitalWrite(builtinLED, LOW);
      delay(300);
      digitalWrite(builtinLED, HIGH);
      delay(300);
    }
  } else {
    digitalWrite(builtinLED, HIGH);
    Serial.println("\nConnected with IP: " + WiFi.localIP().toString());
  }
}

void setup_firebase() {
  Serial.printf("Firebase Client v%s\n\n", FIREBASE_CLIENT_VERSION);

  /* Assign the api key (required) */
  config.api_key = API_KEY;

  /* Assign the user sign in credentials */
  auth.user.email = USER_EMAIL;
  auth.user.password = USER_PASSWORD;

  /* Assign the RTDB URL (required) */
  config.database_url = DATABASE_URL;

  /* Assign the callback function for the long running token generation task */
  config.token_status_callback = tokenStatusCallback;  // see addons/TokenHelper.h

  // Comment or pass false value when WiFi reconnection will control by your code or third party library e.g. WiFiManager
  Firebase.reconnectNetwork(true);

  // Since v4.4.x, BearSSL engine was used, the SSL buffer need to be set.
  // Large data transmission may require larger RX buffer, otherwise connection issue or data read time out can be occurred.
  fbdo.setBSSLBufferSize(4096 /* Rx buffer size in bytes from 512 - 16384 */, 1024 /* Tx buffer size in bytes from 512 - 16384 */);

  // Limit the size of response payload to be collected in FirebaseData
  fbdo.setResponseSize(2048);

  Firebase.begin(&config, &auth);

  Firebase.setDoubleDigits(5);

  config.timeout.serverResponse = 10 * 1000;
}

void config_time() {
  if (!rtc.begin()) {
    Serial.println("RTC module is NOT found");
    Serial.flush();
  }
}

void setup() {
  Serial.begin(115200);
  initialized_used_pins();
  setup_WiFi();
  setup_firebase();
  config_time();
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    setup_WiFi();  // Reconnect to Wi-Fi if disconnected
  }

  // Firebase.ready() should be called repeatedly to handle authentication tasks.
  if (Firebase.ready() && (millis() - sendDataPrevMillis > 3000 || sendDataPrevMillis == 0)) {
    sendDataPrevMillis = millis();

    bool enableSystem = false;
    if (Firebase.RTDB.getBool(&fbdo, path0.c_str(), &enableSystem)) {
      Serial.printf("Get enableSystem... %s\n", enableSystem ? "true" : "false");
    } else {
      Serial.printf("Firebase Error: %s\n", fbdo.errorReason().c_str());
      enableSystem = false;  // Ensure default value
    }

    if (enableSystem) {
      // Read battery percentage (adjusted for 12-bit ADC)
      int batteryPercentage = map(analogRead(batteryPercentagePin), 0, 2000, 0, 100);
      String currentTimeAndDate = getFormattedTime();

      // Read moisture sensor values (adjusted for 12-bit ADC)
      int moistureSensor1 = map(analogRead(moistureSensorPin1), 0, 4095, 100, 0);
      int moistureSensor2 = map(analogRead(moistureSensorPin2), 0, 4095, 100, 0);

      // Send data to Firebase using the pre-defined path constants
      Serial.printf("Set batteryPercentage... %s : %d\n", Firebase.RTDB.setInt(&fbdo, path1.c_str(), batteryPercentage) ? "ok" : fbdo.errorReason().c_str(), batteryPercentage);
      Serial.printf("Set currentTimeAndDate... %s : %s\n", Firebase.RTDB.setString(&fbdo, path2.c_str(), currentTimeAndDate) ? "ok" : fbdo.errorReason().c_str(), currentTimeAndDate);
      Serial.printf("Set moistureSensor1... %s : %d\n", Firebase.RTDB.setInt(&fbdo, path3.c_str(), moistureSensor1) ? "ok" : fbdo.errorReason().c_str(), moistureSensor1);
      Serial.printf("Set moistureSensor2... %s : %d\n", Firebase.RTDB.setInt(&fbdo, path4.c_str(), moistureSensor2) ? "ok" : fbdo.errorReason().c_str(), moistureSensor2);
    }
  }
}

String getFormattedTime() {
  DateTime now = rtc.now(); // Get current date/time from RTC
  
  // Store values in variables
  int year = now.year();
  int month = now.month();
  int day = now.day();
  int dayOfWeek = now.dayOfTheWeek();
  int hour = now.hour();
  int minute = now.minute();
  int second = now.second();

  String string_time = String(hour) + ":" + String(minute) + ":" + String(second);
  String string_date = String(month) + "/" + String(day) + "/" + String(year);

  // Return the formatted time and date as "HH:MM:SS MM/DD/YYYY"
  return string_time + " " + string_date;
}
