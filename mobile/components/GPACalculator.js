import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Picker } from '@react-native-picker/picker'; // Import Picker from the new package
import Icon from 'react-native-vector-icons/Ionicons';

// Define common styles
const STATIC_COLORS = {
  primary: '#6A1B9A', // Deep Purple
  primaryDark: '#4A0072',
  primaryLight: '#9C4DCC',
  secondary: '#4CAF50', // Green
  accent: '#F59E0B', // Amber
  error: '#D32F2F',
  success: '#2E7D32',
  background: '#F4F6F8',
  surface: '#FFFFFF',
  text: '#1A202C',
  textSecondary: '#4A5568',
  textMuted: '#718096',
  textOnPrimary: '#FFFFFF',
  border: '#E2E8F0',
  placeholder: '#A0AEC0',
  disabled: '#D1D5DB',
};

const TYPOGRAPHY = {
  h1: { fontSize: 28, fontWeight: 'bold', color: STATIC_COLORS.primaryDark },
  h2: { fontSize: 22, fontWeight: 'bold', color: STATIC_COLORS.text },
  h3: { fontSize: 18, fontWeight: '600', color: STATIC_COLORS.text },
  body: { fontSize: 16, color: STATIC_COLORS.textSecondary },
  caption: { fontSize: 12, color: STATIC_COLORS.textMuted },
  button: {
    fontSize: 16,
    fontWeight: 'bold',
    color: STATIC_COLORS.textOnPrimary,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: STATIC_COLORS.text,
    marginBottom: 8,
  },
};

const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

// Default grading scales (can be expanded or fetched from settings)
const GRADING_SCALES = {
  ghanaTertiary: {
    name: 'Ghana Tertiary (A=80-100)',
    grades: [
      { grade: 'A', min: 80, max: 100, gpa: 4.0 },
      { grade: 'B+', min: 75, max: 79, gpa: 3.5 },
      { grade: 'B', min: 70, max: 74, gpa: 3.0 },
      { grade: 'C+', min: 65, max: 69, gpa: 2.5 },
      { grade: 'C', min: 60, max: 64, gpa: 2.0 },
      { grade: 'D+', min: 55, max: 59, gpa: 1.5 },
      { grade: 'D', min: 50, max: 54, gpa: 1.0 },
      { grade: 'F', min: 0, max: 49, gpa: 0.0 },
    ],
  },
  standard: {
    name: 'Standard (A=90, B=80, etc.)',
    grades: [
      { grade: 'A+', min: 97, max: 100, gpa: 4.0 },
      { grade: 'A', min: 93, max: 96, gpa: 4.0 },
      { grade: 'A-', min: 90, max: 92, gpa: 3.7 },
      { grade: 'B+', min: 87, max: 89, gpa: 3.3 },
      { grade: 'B', min: 83, max: 86, gpa: 3.0 },
      { grade: 'B-', min: 80, max: 82, gpa: 2.7 },
      { grade: 'C+', min: 77, max: 79, gpa: 2.3 },
      { grade: 'C', min: 73, max: 76, gpa: 2.0 },
      { grade: 'C-', min: 70, max: 72, gpa: 1.7 },
      { grade: 'D+', min: 67, max: 69, gpa: 1.3 },
      { grade: 'D', min: 60, max: 66, gpa: 1.0 },
      { grade: 'F', min: 0, max: 59, gpa: 0.0 },
    ],
  },
  scale2: {
    name: 'Alternative (A=85, B=75, etc.)',
    grades: [
      { grade: 'A', min: 85, max: 100, gpa: 4.0 },
      { grade: 'B', min: 75, max: 84, gpa: 3.0 },
      { grade: 'C', min: 65, max: 74, gpa: 2.0 },
      { grade: 'D', min: 55, max: 64, gpa: 1.0 },
      { grade: 'F', min: 0, max: 54, gpa: 0.0 },
    ],
  },
};

const GPACalculator = () => {
  const [courses, setCourses] = useState([
    { id: Date.now().toString(), name: '', credits: '', marks: '' },
  ]);
  const [gpa, setGpa] = useState(null);
  const [cwa, setCwa] = useState(null);
  const [selectedScaleKey, setSelectedScaleKey] = useState('ghanaTertiary'); // Set Ghana Tertiary as default
  const [knownCWA, setKnownCWA] = useState(''); // For CWA to GPA conversion input
  const [convertedGpaFromCwa, setConvertedGpaFromCwa] = useState(null); // For CWA to GPA conversion result

  const currentGradePoints = GRADING_SCALES[selectedScaleKey].grades;

  const getGpaForRawScore = (score) => {
    // Renamed for clarity, can be used for marks or CWA
    const numericScore = parseFloat(score);
    if (isNaN(numericScore) || numericScore < 0 || numericScore > 100)
      return null;
    for (const scale of currentGradePoints) {
      if (numericScore >= scale.min && numericScore <= scale.max) {
        return scale.gpa;
      }
    }
    return null;
  };

  const handleCourseChange = (id, field, value) => {
    setCourses(
      courses.map((course) =>
        course.id === id ? { ...course, [field]: value } : course,
      ),
    );
    setGpa(null);
    setCwa(null);
  };

  const addCourse = () => {
    setCourses([
      ...courses,
      { id: Date.now().toString(), name: '', credits: '', marks: '' },
    ]);
  };

  const removeCourse = (id) => {
    setCourses(courses.filter((course) => course.id !== id));
    setGpa(null);
    setCwa(null);
  };

  const calculateGpaAndCwa = () => {
    let totalGpaPoints = 0;
    let totalCreditsForGpa = 0;
    let totalWeightedMarks = 0;
    let totalCreditsForCwa = 0;
    let validInput = true;

    if (courses.length === 0) {
      Alert.alert('No Courses', 'Please add at least one course to calculate.');
      return;
    }

    courses.forEach((course) => {
      const credits = parseFloat(course.credits);
      const marks = parseFloat(course.marks);

      if (isNaN(credits) || credits <= 0) {
        Alert.alert(
          'Invalid Input',
          `Please enter valid positive credits for ${course.name || 'a course'}.`,
        );
        validInput = false;
        return;
      }
      if (isNaN(marks) || marks < 0 || marks > 100) {
        Alert.alert(
          'Invalid Input',
          `Please enter valid marks (0-100) for ${course.name || 'a course'}.`,
        );
        validInput = false;
        return;
      }

      // GPA Calculation
      const gpaValue = getGpaForRawScore(marks);
      if (gpaValue === null) {
        Alert.alert(
          'Grade Not Found',
          `Could not determine GPA for marks ${marks} in ${course.name || 'a course'} using the selected scale.`,
        );
        validInput = false;
        return;
      }
      totalGpaPoints += gpaValue * credits;
      totalCreditsForGpa += credits;

      // CWA Calculation (uses raw marks)
      totalWeightedMarks += marks * credits;
      totalCreditsForCwa += credits;
    });

    if (!validInput) {
      setGpa(null);
      setCwa(null);
      return;
    }

    if (totalCreditsForGpa > 0) {
      setGpa((totalGpaPoints / totalCreditsForGpa).toFixed(2));
    } else {
      setGpa(null);
    }

    if (totalCreditsForCwa > 0) {
      setCwa((totalWeightedMarks / totalCreditsForCwa).toFixed(2));
    } else {
      setCwa(null);
    }
  };

  useEffect(() => {
    // Recalculate if scale changes and courses exist
    if (courses.some((c) => c.credits && c.marks)) {
      calculateGpaAndCwa();
    }
    // Also, if knownCWA has a value, try to reconvert it if the scale changes
    if (knownCWA) {
      convertCwaToGpa();
    }
  }, [selectedScaleKey]); // Recalculate when scale changes

  const handleKnownCwaChange = (value) => {
    setKnownCWA(value);
    setConvertedGpaFromCwa(null); // Reset previous conversion result when CWA input changes
  };

  const convertCwaToGpa = () => {
    if (!knownCWA.trim()) {
      Alert.alert('Input Required', 'Please enter your CWA value.');
      setConvertedGpaFromCwa(null);
      return;
    }
    const numericCWA = parseFloat(knownCWA);
    if (isNaN(numericCWA) || numericCWA < 0 || numericCWA > 100) {
      Alert.alert('Invalid CWA', 'Please enter a valid CWA (0-100).');
      setConvertedGpaFromCwa(null);
      return;
    }
    const gpaValue = getGpaForRawScore(numericCWA);
    if (gpaValue !== null) {
      setConvertedGpaFromCwa(gpaValue.toFixed(2));
    } else {
      Alert.alert(
        'Conversion Error',
        `Could not convert CWA ${numericCWA} to GPA using the selected scale. Check if the CWA is within the defined ranges.`,
      );
      setConvertedGpaFromCwa(null);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContentContainer}>
        <Text style={styles.mainHeader}>GPA & CWA Calculator</Text>

        <View style={styles.scaleSelectorContainer}>
          <Text style={TYPOGRAPHY.label}>Select Grading Scale:</Text>
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={selectedScaleKey}
              style={styles.picker}
              onValueChange={(itemValue) => setSelectedScaleKey(itemValue)}
              itemStyle={styles.pickerItem} // For iOS picker item styling
            >
              {Object.keys(GRADING_SCALES).map((key) => (
                <Picker.Item
                  key={key}
                  label={GRADING_SCALES[key].name}
                  value={key}
                />
              ))}
            </Picker>
          </View>
        </View>

        {courses.map((course, index) => (
          <View key={course.id} style={styles.courseCard}>
            <View style={styles.courseHeader}>
              <Text style={styles.courseTitle}>{`Course ${index + 1}`}</Text>
              {courses.length > 1 && (
                <TouchableOpacity
                  onPress={() => removeCourse(course.id)}
                  style={styles.removeButton}
                >
                  <Icon
                    name="trash-outline"
                    size={22}
                    color={STATIC_COLORS.error}
                  />
                </TouchableOpacity>
              )}
            </View>
            <TextInput
              style={styles.input}
              placeholder={`Course Name (e.g., Calculus I)`}
              placeholderTextColor={STATIC_COLORS.placeholder}
              value={course.name}
              onChangeText={(text) =>
                handleCourseChange(course.id, 'name', text)
              }
            />
            <View style={styles.rowInputContainer}>
              <TextInput
                style={[
                  styles.input,
                  styles.flexInput,
                  { marginRight: SPACING.sm },
                ]}
                placeholder="Credits"
                placeholderTextColor={STATIC_COLORS.placeholder}
                value={String(course.credits)}
                onChangeText={(text) =>
                  handleCourseChange(course.id, 'credits', text)
                }
                keyboardType="numeric"
              />
              <TextInput
                style={[styles.input, styles.flexInput]}
                placeholder="Marks (0-100)"
                placeholderTextColor={STATIC_COLORS.placeholder}
                value={String(course.marks)}
                onChangeText={(text) =>
                  handleCourseChange(course.id, 'marks', text)
                }
                keyboardType="numeric"
              />
            </View>
          </View>
        ))}

        <TouchableOpacity style={styles.addButton} onPress={addCourse}>
          <Icon
            name="add-circle-outline"
            size={24}
            color={STATIC_COLORS.textOnPrimary}
          />
          <Text style={styles.addButtonText}>Add Course</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.calculateButton}
          onPress={calculateGpaAndCwa}
        >
          <Text style={styles.calculateButtonText}>Calculate GPA & CWA</Text>
        </TouchableOpacity>

        {(gpa !== null || cwa !== null) && (
          <View style={styles.resultsContainer}>
            <Text style={styles.resultsTitle}>Results:</Text>
            {gpa !== null && (
              <Text style={styles.resultText}>{`GPA: ${gpa}`}</Text>
            )}
            {cwa !== null && (
              <Text style={styles.resultText}>{`CWA: ${cwa}%`}</Text>
            )}
            {gpa === null &&
              cwa === null &&
              courses.length > 0 &&
              courses.some((c) => c.credits && c.marks) && (
                <Text style={styles.resultText}>
                  Please ensure all fields are correctly filled.
                </Text>
              )}
          </View>
        )}

        {/* CWA to GPA Conversion Section */}
        <View style={styles.conversionSectionCard}>
          <Text style={styles.sectionTitle}>Convert CWA to GPA</Text>
          <Text style={TYPOGRAPHY.label}>Enter your CWA (%):</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., 78.5"
            placeholderTextColor={STATIC_COLORS.placeholder}
            value={knownCWA}
            onChangeText={handleKnownCwaChange}
            keyboardType="numeric"
          />
          <TouchableOpacity
            style={styles.convertButton}
            onPress={convertCwaToGpa}
          >
            <Text style={styles.convertButtonText}>Convert to GPA</Text>
          </TouchableOpacity>
          {convertedGpaFromCwa !== null && (
            <View style={styles.conversionResultContainer}>
              <Text
                style={styles.resultText}
              >{`Equivalent GPA: ${convertedGpaFromCwa}`}</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: STATIC_COLORS.background,
  },
  scrollContentContainer: {
    padding: SPACING.md,
    paddingBottom: SPACING.xl * 2, // Extra padding for scroll
  },
  mainHeader: {
    ...TYPOGRAPHY.h1,
    textAlign: 'center',
    marginBottom: SPACING.lg,
    color: STATIC_COLORS.primary,
  },
  scaleSelectorContainer: {
    marginBottom: SPACING.lg,
    padding: SPACING.md,
    backgroundColor: STATIC_COLORS.surface,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: STATIC_COLORS.border,
    borderRadius: 8,
    backgroundColor: STATIC_COLORS.surface, // Ensure picker background is clean
    overflow: 'hidden', // Helps with border radius on Android
  },
  picker: {
    height: 50,
    width: '100%',
    color: STATIC_COLORS.text, // Text color for picker items
  },
  pickerItem: {
    // For iOS picker item styling (does not work on Android for item text color directly)
    // On Android, picker item color is often inherited or controlled by theme.
    // For consistent styling, a custom picker component might be needed for full control.
    backgroundColor: STATIC_COLORS.surface, // Background of items in dropdown
    color: STATIC_COLORS.text,
  },
  courseCard: {
    backgroundColor: STATIC_COLORS.surface,
    borderRadius: 8,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  courseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  courseTitle: {
    ...TYPOGRAPHY.h3,
    color: STATIC_COLORS.primaryDark,
  },
  removeButton: {
    padding: SPACING.xs,
  },
  input: {
    backgroundColor: STATIC_COLORS.background, // Slightly different background for inputs
    borderColor: STATIC_COLORS.border,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: TYPOGRAPHY.body.fontSize,
    color: STATIC_COLORS.text,
    marginBottom: SPACING.sm, // Default margin for single inputs
  },
  rowInputContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.xs, // Add some top margin if it's after course name
  },
  flexInput: {
    flex: 1,
    marginBottom: 0, // Remove bottom margin as it's handled by container or card
  },
  addButton: {
    flexDirection: 'row',
    backgroundColor: STATIC_COLORS.secondary,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.sm, // Margin from the last course card
    marginBottom: SPACING.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  addButtonText: {
    ...TYPOGRAPHY.button,
    marginLeft: SPACING.sm,
  },
  calculateButton: {
    backgroundColor: STATIC_COLORS.primary,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  calculateButtonText: {
    ...TYPOGRAPHY.button,
  },
  resultsContainer: {
    marginTop: SPACING.md,
    padding: SPACING.md,
    backgroundColor: STATIC_COLORS.surface,
    borderRadius: 8,
    borderLeftWidth: 5,
    borderLeftColor: STATIC_COLORS.accent,
    elevation: 1,
  },
  resultsTitle: {
    ...TYPOGRAPHY.h2,
    marginBottom: SPACING.sm,
    color: STATIC_COLORS.primaryDark,
  },
  resultText: {
    ...TYPOGRAPHY.body,
    fontSize: 18, // Larger font for results
    marginBottom: SPACING.xs,
    color: STATIC_COLORS.text,
  },
  // Styles for CWA to GPA conversion section
  conversionSectionCard: {
    backgroundColor: STATIC_COLORS.surface,
    borderRadius: 8,
    padding: SPACING.md,
    marginTop: SPACING.lg, // Add margin from the results container
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h2,
    marginBottom: SPACING.md,
    color: STATIC_COLORS.primaryDark,
    textAlign: 'center',
  },
  convertButton: {
    backgroundColor: STATIC_COLORS.accent, // Using accent color for this button
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.sm, // Margin from the input field
    marginBottom: SPACING.sm,
    elevation: 2,
  },
  convertButtonText: {
    ...TYPOGRAPHY.button,
    color: STATIC_COLORS.primaryDark, // Darker text on accent for contrast
  },
  conversionResultContainer: {
    marginTop: SPACING.sm,
    padding: SPACING.sm,
    backgroundColor: STATIC_COLORS.background, // Light background for the result
    borderRadius: 4,
    alignItems: 'center',
  },
});

export default GPACalculator;
