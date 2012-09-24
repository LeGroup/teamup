import codecs

server_path='./'   # this path should point to team_up_server i18n.
teamup_path='/Users/purma/itec-wp3/teamup/trunk/TeamUp/i18n/' # this path should point to TeamUp's i18n, relative or absolute

name_base='localized_%s.%s'
base=codecs.open(server_path+name_base % ('fi-FI','js'),'r','utf_8_sig')

server_keys=[]

for line in base.readlines():
    as_list=line.split(':',1)
    if len(as_list)<2:
        continue
    key, value=tuple(as_list)
    server_keys.append(key.strip())

base.close()

base=open(teamup_path+name_base % ('fi-FI','js'))

teamup_keys=[]

for line in base.readlines():
    as_list=line.split(':',1)
    if len(as_list)<2:
        continue
    key, value=tuple(as_list)
    teamup_keys.append(key.strip())

base.close()


others=['de-AT','es-ES', 'et-ET', 'fi-FI', 'fr-FR','he-HE','hu-HU','it-IT', 'lt-LT', 'nl-NL','no-NO','pt-PT','sk-SK','tr-TR']

for lang_code in others:
    file1=codecs.open(server_path+name_base % (lang_code, 'js'),'r','utf_8_sig')
    file2=codecs.open(teamup_path+name_base % (lang_code, 'js'),'r','utf_8_sig')
    oldd={}
    for line in file1.readlines()+file2.readlines():
        as_list=line.split(':',1)
        if len(as_list)<2:
            continue
        key, value=tuple(as_list)
        key=key.strip()
        value=value.strip(' \n\r,')
        if value:
            oldd[key]=value
    file1.close()
    file2.close()
    new_file=codecs.open(server_path+'new_translations/'+name_base % (lang_code, 'txt'), 'w','utf_8_sig')
    #new_file.write( codecs.BOM_UTF8 )
    new_file.write('{\n')
    count=0
    for key in teamup_keys:
        count+=1
        if (key==teamup_keys[-1]):
            line_ending='\n}'
        else:
            line_ending=',\n'
        content=oldd.get(key, '""')
        new_file.write('%s: %s%s' % (key, content, line_ending))
        if count==5:
            new_file.write('\n')
            count=0
    new_file.write('\n\n{\n')
    count=0
    for key in server_keys:
        count+=1
        if (key==server_keys[-1]):
            line_ending='\n}'
        else:
            line_ending=',\n'
        content=oldd.get(key, '""')
        new_file.write('%s: %s%s' % (key, content, line_ending))
        if count==5:
            new_file.write('\n')
            count=0

    new_file.close()

        

