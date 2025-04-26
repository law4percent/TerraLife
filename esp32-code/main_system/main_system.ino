// varaint_system.ino
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

#include <RTClib.h>
RTC_DS3231 rtc;

#include <Firebase_ESP_Client.h>
#include <addons/TokenHelper.h>
#include <addons/RTDBHelper.h>

const byte builtinLED = 2;
const byte relayPin = 13;

#include <DHT.h>
#define DHTPIN 26
#define DHTTYPE DHT11
DHT dht(DHTPIN, DHTTYPE);
float humidity = 0.0;
float temperature = 0.0;

// Define Firebase Data object
FirebaseData fbdo;

FirebaseAuth auth;
FirebaseConfig config;

String getPath(int systemNumber, String pathType) {
  return "/users/" + String(USER_ID) + "/system" + String(systemNumber) + "/" + pathType;
}

const String main_path1 = getPath(0, "humidity");
const String main_path2 = getPath(0, "lastUpdated");
const String main_path3 = getPath(0, "sprinklerStatus");
const String main_path4 = getPath(0, "temperature");

const String variant1_path0 = getPath(1, "enable");
const String variant1_path1 = getPath(1, "soilMoisture1");
const String variant1_path2 = getPath(1, "soilMoisture2");

const String variant2_path0 = getPath(2, "enable");
const String variant2_path1 = getPath(2, "soilMoisture1");
const String variant2_path2 = getPath(2, "soilMoisture2");

// const String variant3_path0 = getPath(3, "enable");
// const String variant3_path1 = getPath(3, "soilMoisture1");
// const String variant3_path2 = getPath(3, "soilMoisture2");

// const String variant4_path0 = getPath(4, "enable");
// const String variant4_path1 = getPath(4, "soilMoisture1");
// const String variant4_path2 = getPath(4, "soilMoisture2");

// const String variant5_path0 = getPath(5, "enable");
// const String variant5_path1 = getPath(5, "soilMoisture1");
// const String variant5_path2 = getPath(5, "soilMoisture2");

// const String variant6_path0 = getPath(6, "enable");
// const String variant6_path1 = getPath(6, "soilMoisture1");
// const String variant6_path2 = getPath(6, "soilMoisture2");

// const String variant7_path0 = getPath(7, "enable");
// const String variant7_path1 = getPath(7, "soilMoisture1");
// const String variant7_path2 = getPath(7, "soilMoisture2");

// const String variant8_path0 = getPath(8, "enable");
// const String variant8_path1 = getPath(8, "soilMoisture1");
// const String variant8_path2 = getPath(8, "soilMoisture2");

// const String variant9_path0 = getPath(9, "enable");
// const String variant9_path1 = getPath(9, "soilMoisture1");
// const String variant9_path2 = getPath(9, "soilMoisture2");

// const String variant10_path0 = getPath(10, "enable");
// const String variant10_path1 = getPath(10, "soilMoisture1");
// const String variant10_path2 = getPath(10, "soilMoisture2");

// const String variant11_path0 = getPath(11, "enable");
// const String variant11_path1 = getPath(11, "soilMoisture1");
// const String variant11_path2 = getPath(11, "soilMoisture2");

// const String variant12_path0 = getPath(12, "enable");
// const String variant12_path1 = getPath(12, "soilMoisture1");
// const String variant12_path2 = getPath(12, "soilMoisture2");

// const String variant13_path0 = getPath(13, "enable");
// const String variant13_path1 = getPath(13, "soilMoisture1");
// const String variant13_path2 = getPath(13, "soilMoisture2");

// const String variant14_path0 = getPath(14, "enable");
// const String variant14_path1 = getPath(14, "soilMoisture1");
// const String variant14_path2 = getPath(14, "soilMoisture2");

// const String variant15_path0 = getPath(15, "enable");
// const String variant15_path1 = getPath(15, "soilMoisture1");
// const String variant15_path2 = getPath(15, "soilMoisture2");

int sprinklerStatus = 0;
bool start_time = false;
bool try_again_to_OFF = false;
unsigned long sendDataPrevMillis1 = 0;
unsigned long sendDataPrevMillis2 = 0;
unsigned long sprinklerTimer = 0;

const long interval_for_sprinkler = 360000;

void initialized_used_pins() {
  pinMode(builtinLED, OUTPUT);
  pinMode(relayPin, OUTPUT);
}

void setup_WiFi() {
  Serial.print("Connecting to Wi-Fi");
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  unsigned long startAttemptTime = millis();

  // Reconnecting to the internet
  while (WiFi.status() != WL_CONNECTED && millis() - startAttemptTime < 30000) {  // 30s timeout
    Serial.print(".");
    digitalWrite(builtinLED, LOW);
    delay(1000);
    digitalWrite(builtinLED, HIGH);
    delay(1000);

    if (millis() - sprinklerTimer >= interval_for_sprinkler) {
      digitalWrite(relayPin, LOW);  // Turn off the relay (sprinkler)
      start_time = false;           // Reset the start_time flag
      try_again_to_OFF = false;
    }
  }

  // Indicating to restart the system
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("\nFailed to connect to WiFi!");
    while (true) {
      digitalWrite(builtinLED, LOW);
      delay(300);
      digitalWrite(builtinLED, HIGH);
      delay(300);

      if (millis() - sprinklerTimer >= interval_for_sprinkler) {
        digitalWrite(relayPin, LOW);  // Turn off the relay (sprinkler)
      }
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
  dht.begin();
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

  if (Firebase.ready()) {
    unsigned long current_millis = millis();

    if (current_millis - sendDataPrevMillis1 >= 1500) {
      sendDataPrevMillis1 = current_millis;

      if (!start_time) {
        sprinklerStatus += check_manual_sprinkler();

        int variant1 = check_variant_sensors(1, variant1_path0, variant1_path1, variant1_path2);
        int variant2 = check_variant_sensors(2, variant2_path0, variant2_path1, variant2_path2);

        if (variant1 != 5) sprinklerStatus += variant1;
        if (variant2 != 5) sprinklerStatus += variant2;
      }

      if (try_again_to_OFF) try_again_to_OFF = Firebase.RTDB.setString(&fbdo, main_path3.c_str(), "OFF");
    }

    if (current_millis - sendDataPrevMillis2 >= 5000) {
      sendDataPrevMillis2 = current_millis;

      readHumidityandTemperature();
      Serial.printf("Set humidity... %s : %s\n", Firebase.RTDB.setFloat(&fbdo, main_path1.c_str(), humidity) ? "ok" : fbdo.errorReason().c_str(), String(humidity));
      Serial.printf("Set temperature... %s : %s\n", Firebase.RTDB.setFloat(&fbdo, main_path4.c_str(), temperature) ? "ok" : fbdo.errorReason().c_str(), String(temperature));

      String currentTimeAndDate = getFormattedTime();
      Serial.printf("Set lastUpdated... %s : %s\n", Firebase.RTDB.setString(&fbdo, main_path2.c_str(), currentTimeAndDate) ? "ok" : fbdo.errorReason().c_str(), currentTimeAndDate);
    }


    // Start sprinkler if either A or B is true and start_time is false
    if ((sprinklerStatus > 0) && !start_time) {
      start_time = true;
      Serial.printf("Set sprinkler status... %s : ON\n", Firebase.RTDB.setString(&fbdo, main_path3.c_str(), "ON") ? "ok" : fbdo.errorReason().c_str());
      sprinklerStatus = 0;
      digitalWrite(relayPin, HIGH);  // Turn on the relay (sprinkler)
      sprinklerTimer = millis();
    }

    // Stop the sprinkler if 6 minutes (360000) have passed since the start time
    if (start_time && (millis() - sprinklerTimer >= interval_for_sprinkler)) {
      digitalWrite(relayPin, LOW);  // Turn off the relay (sprinkler)
      start_time = false;           // Reset the start_time flag

      String check_sprinkler_sent = Firebase.RTDB.setString(&fbdo, main_path3.c_str(), "OFF") ? "ok" : fbdo.errorReason().c_str();
      try_again_to_OFF = !check_sprinkler_sent.equals("ok");
      Serial.printf("Set sprinkler status... %s : OFF\n", check_sprinkler_sent);
    }

    Serial.printf("\nSprinkler status... %s\n", start_time ? "ON" : "OFF");
  }
}

bool check_manual_sprinkler() {
  if (Firebase.RTDB.getString(&fbdo, main_path3.c_str())) {
    String manualSprinklerStatus = fbdo.to<const char *>();
    Serial.printf("\nGet manual sprinkler status... %s\n", manualSprinklerStatus);
    return manualSprinklerStatus.equals("ON");
  } else {
    Serial.printf("\nFailed to get manual sprinkler status: %s\n", fbdo.errorReason().c_str());
    return false;
  }
}

int check_variant_sensors(const byte variant_ID, const String variant_path0, const String variant_path1, const String variant_path2) {
  bool enableSystem = false;

  // Get the enable system flag
  if (Firebase.RTDB.getBool(&fbdo, variant_path0.c_str(), &enableSystem)) {
    Serial.printf("\nGet variant%d enable is... %s\n", variant_ID, enableSystem ? "true" : "false");

    if (enableSystem) {
      bool soilmoistureA_status = false;
      bool soilmoistureB_status = false;

      // Get the first moisture sensor value
      if (Firebase.RTDB.getInt(&fbdo, variant_path1.c_str())) {
        int moisture_sensor1 = fbdo.to<int>();
        Serial.printf("Get variant%d moistureSensor1... %d\n", variant_ID, moisture_sensor1);
        soilmoistureA_status = checkMoistureLevel(moisture_sensor1);
      } else {
        Serial.printf("Failed to get variant%d moistureSensor1: %s\n", variant_ID, fbdo.errorReason().c_str());
      }

      // Get the second moisture sensor value
      if (Firebase.RTDB.getInt(&fbdo, variant_path2.c_str())) {
        int moisture_sensor2 = fbdo.to<int>();
        Serial.printf("Get variant%d moistureSensor2... %d\n", variant_ID, moisture_sensor2);
        soilmoistureB_status = checkMoistureLevel(moisture_sensor2);
      } else {
        Serial.printf("Failed to get variant%d moistureSensor2: %s\n", variant_ID, fbdo.errorReason().c_str());
      }

      return soilmoistureA_status || soilmoistureB_status;  // return 0 and 1 is okay
    } else {
      Serial.printf("Variant System No.%d is in unable mode.\n", variant_ID);
      return 5;  // returning 5 indicates the system is unable mode so no reading
    }
  } else {
    Serial.printf("Variant System No.%d is in unable mode.\n", variant_ID);
    return 5;  // returning 5 indicates the system is unable mode so no reading
  }
}

bool checkMoistureLevel(const int moisturePerentageLevel) {
  return moisturePerentageLevel < 40;
}

void readHumidityandTemperature() {
  humidity = dht.readHumidity();
  temperature = dht.readTemperature();

  if (isnan(humidity) || isnan(temperature)) {
    Serial.println(F("DHT failed, need to fix!"));
    humidity = 0.0;
    temperature = 0.0;
    return;
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
