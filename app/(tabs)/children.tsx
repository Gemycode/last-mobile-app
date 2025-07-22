import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Modal, TextInput, Alert } from 'react-native';
import { Plus, User, GraduationCap, School } from 'lucide-react-native';
import CustomHeader from '../../components/CustomHeader';
import Card from '../../components/Card';
import { Colors } from '../../constants/Colors';
import { useAppStore } from '../../store/appStore';
import { useAuthStore } from '../../store/authStore';

export default function ChildrenScreen() {
  const [modalVisible, setModalVisible] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    grade: '',
    school: '',
  });

  const user = useAuthStore(state => state.user);
  const { children, addChild } = useAppStore();

  const handleAddChild = () => {
    if (!formData.name || !formData.grade || !formData.school) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    addChild({
      ...formData,
      parentId: user?.id || '',
    });

    setFormData({ name: '', grade: '', school: '' });
    setModalVisible(false);
    Alert.alert('Success', 'Child added successfully!');
  };

  return (
    <View style={styles.screen}>
      <CustomHeader title="My Children" />
      
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Manage Your Children</Text>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => setModalVisible(true)}
          >
            <Plus size={20} color={Colors.white} />
            <Text style={styles.addButtonText}>Add Child</Text>
          </TouchableOpacity>
        </View>

        {children.length === 0 ? (
          <Card style={styles.emptyCard}>
            <User size={48} color={Colors.gray[400]} style={styles.emptyIcon} />
            <Text style={styles.emptyText}>No children added yet</Text>
            <Text style={styles.emptySubtext}>
              Add your first child to start tracking their bus
            </Text>
            <TouchableOpacity 
              style={styles.emptyButton}
              onPress={() => setModalVisible(true)}
            >
              <Text style={styles.emptyButtonText}>Add First Child</Text>
            </TouchableOpacity>
          </Card>
        ) : (
          children.map((child) => (
            <Card key={child.id} style={styles.childCard}>
              <View style={styles.childHeader}>
                <View style={styles.avatar}>
                  <User size={24} color={Colors.white} />
                </View>
                <View style={styles.childInfo}>
                  <Text style={styles.childName}>{child.name}</Text>
                  <Text style={styles.childDetails}>{child.grade} • {child.school}</Text>
                </View>
              </View>
              
              <View style={styles.childStatus}>
                {child.busId ? (
                  <View style={styles.statusRow}>
                    <View style={[styles.statusBadge, styles.activeStatus]}>
                      <Text style={styles.statusText}>Assigned</Text>
                    </View>
                    <Text style={styles.busInfo}>Bus {child.busId}</Text>
                  </View>
                ) : (
                  <View style={styles.statusRow}>
                    <View style={[styles.statusBadge, styles.pendingStatus]}>
                      <Text style={styles.statusText}>Pending</Text>
                    </View>
                    <Text style={styles.pendingText}>No bus assigned</Text>
                  </View>
                )}
              </View>

              <View style={styles.childActions}>
                <TouchableOpacity style={styles.actionButton}>
                  <Text style={styles.actionButtonText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton}>
                  <Text style={styles.actionButtonText}>View Schedule</Text>
                </TouchableOpacity>
              </View>
            </Card>
          ))
        )}
      </ScrollView>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add New Child</Text>
            
            <View style={styles.inputContainer}>
              <User size={20} color={Colors.gray[500]} />
              <TextInput
                style={styles.input}
                placeholder="Child's Full Name"
                value={formData.name}
                onChangeText={(value) => setFormData(prev => ({ ...prev, name: value }))}
              />
            </View>

            <View style={styles.inputContainer}>
              <GraduationCap size={20} color={Colors.gray[500]} />
              <TextInput
                style={styles.input}
                placeholder="Grade (e.g., 5th Grade)"
                value={formData.grade}
                onChangeText={(value) => setFormData(prev => ({ ...prev, grade: value }))}
              />
            </View>

            <View style={styles.inputContainer}>
              <School size={20} color={Colors.gray[500]} />
              <TextInput
                style={styles.input}
                placeholder="School Name"
                value={formData.school}
                onChangeText={(value) => setFormData(prev => ({ ...prev, school: value }))}
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleAddChild}
              >
                <Text style={styles.saveButtonText}>Add Child</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.gray[100],
  },
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.gray[800],
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: Colors.white,
    marginLeft: 8,
    fontWeight: '600',
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.gray[700],
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    color: Colors.gray[500],
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: Colors.white,
    fontWeight: '600',
  },
  childCard: {
    marginBottom: 16,
  },
  childHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  childInfo: {
    flex: 1,
  },
  childName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.gray[800],
    marginBottom: 4,
  },
  childDetails: {
    fontSize: 14,
    color: Colors.gray[600],
  },
  childStatus: {
    marginBottom: 16,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 12,
  },
  activeStatus: {
    backgroundColor: Colors.success,
  },
  pendingStatus: {
    backgroundColor: Colors.warning,
  },
  statusText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  busInfo: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.gray[800],
  },
  pendingText: {
    fontSize: 16,
    color: Colors.gray[600],
  },
  childActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: Colors.gray[100],
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  actionButtonText: {
    color: Colors.primary,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.gray[800],
    marginBottom: 20,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.gray[300],
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
    backgroundColor: Colors.gray[50],
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: Colors.gray[200],
  },
  cancelButtonText: {
    color: Colors.gray[700],
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: Colors.primary,
  },
  saveButtonText: {
    color: Colors.white,
    fontWeight: '600',
  },
});