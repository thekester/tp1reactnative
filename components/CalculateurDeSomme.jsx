// CalculateurDeSomme.tsx (ou .jsx si tu préfères)
import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import Button from './Button';

function CalculateurDeSomme() {
  const [nombre1, setNombre1] = useState('0');
  const [nombre2, setNombre2] = useState('0');
  const [somme, setSomme] = useState(null);

  const calculerSomme = () => {
    const total = Number(nombre1) + Number(nombre2);
    setSomme(total);
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Nombre 1 :</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={nombre1}
          onChangeText={setNombre1}
        />
      </View>
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Nombre 2 :</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={nombre2}
          onChangeText={setNombre2}
        />
      </View>
      <View style={styles.buttonContainer}>
        <Button onPress={calculerSomme} title="Calculer la somme" />
      </View>
      {somme !== null && (
        <View style={styles.resultContainer}>
          <Text style={styles.resultText}>Résultat : {somme}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#764ba2',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  inputContainer: {
    width: '100%',
    maxWidth: 300,
    marginBottom: 15,
  },
  label: {
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 5,
    fontSize: 16,
  },
  input: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 4,
    fontSize: 16,
  },
  buttonContainer: {
    marginTop: 10,
  },
  resultContainer: {
    marginTop: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 15,
    borderRadius: 8,
  },
  resultText: {
    color: '#fff',
    fontSize: 18,
  },
});

export default CalculateurDeSomme;
