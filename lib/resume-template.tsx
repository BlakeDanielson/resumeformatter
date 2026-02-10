import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";
import { ResumeData } from "./types";
import path from "path";

// Logo path - resolved at build time
const LOGO_PATH = path.join(process.cwd(), "logo.png");

// Professional US-style resume styles
const styles = StyleSheet.create({
  page: {
    padding: 36,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#1a1a1a",
  },
  logo: {
    width: 120,
    height: 22,
    marginBottom: 12,
    alignSelf: "center",
  },
  header: {
    marginBottom: 12,
    textAlign: "center",
  },
  name: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
    color: "#111827",
  },
  contactRow: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: 4,
  },
  contactItem: {
    fontSize: 9,
    color: "#4b5563",
  },
  contactSeparator: {
    fontSize: 9,
    color: "#9ca3af",
    marginHorizontal: 5,
  },
  section: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#111827",
    borderBottomWidth: 1,
    borderBottomColor: "#d1d5db",
    paddingBottom: 2,
    marginBottom: 5,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  summary: {
    fontSize: 9,
    lineHeight: 1.4,
    color: "#374151",
  },
  experienceItem: {
    marginBottom: 8,
  },
  experienceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 1,
  },
  companyTitle: {
    flexDirection: "column",
    flex: 1,
  },
  company: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#1f2937",
  },
  jobTitle: {
    fontSize: 9,
    fontStyle: "italic",
    color: "#4b5563",
  },
  dateLocation: {
    textAlign: "right",
    flexDirection: "column",
    alignItems: "flex-end",
  },
  date: {
    fontSize: 8,
    color: "#6b7280",
  },
  location: {
    fontSize: 8,
    color: "#6b7280",
  },
  bulletList: {
    marginTop: 2,
    paddingLeft: 10,
  },
  bulletItem: {
    flexDirection: "row",
    marginBottom: 1,
  },
  bullet: {
    width: 8,
    fontSize: 9,
  },
  bulletText: {
    flex: 1,
    fontSize: 9,
    lineHeight: 1.3,
    color: "#374151",
  },
  educationItem: {
    marginBottom: 5,
  },
  educationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  institution: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#1f2937",
  },
  degree: {
    fontSize: 9,
    color: "#4b5563",
  },
  skillsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  skillText: {
    fontSize: 9,
    color: "#374151",
  },
  certificationsItem: {
    fontSize: 9,
    color: "#374151",
    marginBottom: 2,
  },
});

interface ResumeDocumentProps {
  data: ResumeData;
}

export function ResumeDocument({ data }: ResumeDocumentProps) {
  const formatDate = (start?: string | null, end?: string | null): string | null => {
    // If no dates at all, return null (don't display anything)
    if (!start && !end) return null;
    
    // If only end date (unlikely but handle it)
    if (!start && end) return end;
    
    // If only start date, show "Start - Present"
    if (start && !end) return `${start} - Present`;
    
    // Both dates exist
    return `${start} - ${end}`;
  };

  const contactItems: string[] = [];
  if (data.contact.email) contactItems.push(data.contact.email);
  if (data.contact.phone) contactItems.push(data.contact.phone);
  if (data.contact.location) contactItems.push(data.contact.location);
  if (data.contact.linkedin) contactItems.push(data.contact.linkedin);
  if (data.contact.website) contactItems.push(data.contact.website);

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        {/* Logo */}
        {/* eslint-disable-next-line jsx-a11y/alt-text */}
        <Image src={LOGO_PATH} style={styles.logo} />

        {/* Header with name and contact */}
        <View style={styles.header}>
          {data.name && <Text style={styles.name}>{data.name}</Text>}
          <View style={styles.contactRow}>
            {contactItems.map((item, index) => (
              <React.Fragment key={index}>
                <Text style={styles.contactItem}>{item}</Text>
                {index < contactItems.length - 1 && (
                  <Text style={styles.contactSeparator}>|</Text>
                )}
              </React.Fragment>
            ))}
          </View>
        </View>

        {/* Professional Summary */}
        {data.summary && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Professional Summary</Text>
            <Text style={styles.summary}>{data.summary}</Text>
          </View>
        )}

        {/* Work Experience */}
        {data.experience.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Professional Experience</Text>
            {data.experience.map((exp, index) => (
              <View key={index} style={styles.experienceItem}>
                <View style={styles.experienceHeader}>
                  <View style={styles.companyTitle}>
                    <Text style={styles.company}>{exp.company}</Text>
                    <Text style={styles.jobTitle}>{exp.title}</Text>
                  </View>
                  <View style={styles.dateLocation}>
                    {formatDate(exp.startDate, exp.endDate) && (
                      <Text style={styles.date}>
                        {formatDate(exp.startDate, exp.endDate)}
                      </Text>
                    )}
                    {exp.location && (
                      <Text style={styles.location}>{exp.location}</Text>
                    )}
                  </View>
                </View>
                {exp.bullets.length > 0 && (
                  <View style={styles.bulletList}>
                    {exp.bullets.map((bullet, bulletIndex) => (
                      <View key={bulletIndex} style={styles.bulletItem}>
                        <Text style={styles.bullet}>•</Text>
                        <Text style={styles.bulletText}>{bullet}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Additional Experience */}
        {data.additionalExperience && data.additionalExperience.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Additional Experience</Text>
            {data.additionalExperience.map((exp, index) => (
              <View key={index} style={styles.experienceItem}>
                <View style={styles.experienceHeader}>
                  <View style={styles.companyTitle}>
                    <Text style={styles.company}>{exp.company}</Text>
                    <Text style={styles.jobTitle}>{exp.title}</Text>
                  </View>
                  <View style={styles.dateLocation}>
                    {formatDate(exp.startDate, exp.endDate) && (
                      <Text style={styles.date}>
                        {formatDate(exp.startDate, exp.endDate)}
                      </Text>
                    )}
                    {exp.location && (
                      <Text style={styles.location}>{exp.location}</Text>
                    )}
                  </View>
                </View>
                {exp.bullets.length > 0 && (
                  <View style={styles.bulletList}>
                    {exp.bullets.map((bullet, bulletIndex) => (
                      <View key={bulletIndex} style={styles.bulletItem}>
                        <Text style={styles.bullet}>•</Text>
                        <Text style={styles.bulletText}>{bullet}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Education */}
        {data.education.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Education</Text>
            {data.education.map((edu, index) => (
              <View key={index} style={styles.educationItem}>
                <View style={styles.educationHeader}>
                  <View style={styles.companyTitle}>
                    <Text style={styles.institution}>{edu.institution}</Text>
                    <Text style={styles.degree}>
                      {edu.degree}
                      {edu.field ? ` in ${edu.field}` : ""}
                      {edu.gpa ? ` | GPA: ${edu.gpa}` : ""}
                      {edu.honors ? ` | ${edu.honors}` : ""}
                    </Text>
                  </View>
                  {edu.graduationDate && (
                    <Text style={styles.date}>{edu.graduationDate}</Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Skills */}
        {data.skills.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Skills</Text>
            <View style={styles.skillsContainer}>
              <Text style={styles.skillText}>{data.skills.join(" • ")}</Text>
            </View>
          </View>
        )}

        {/* Certifications */}
        {data.certifications && data.certifications.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Certifications</Text>
            {data.certifications.map((cert, index) => (
              <Text key={index} style={styles.certificationsItem}>
                • {cert}
              </Text>
            ))}
          </View>
        )}

        {/* Languages */}
        {data.languages && data.languages.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Languages</Text>
            <Text style={styles.skillText}>{data.languages.join(" • ")}</Text>
          </View>
        )}
      </Page>
    </Document>
  );
}
